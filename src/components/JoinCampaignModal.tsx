import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Users, CircleAlert as AlertCircle, Search } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { supabase } from '../config/supabase';
import { router } from 'expo-router';

interface JoinCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function JoinCampaignModal({ isVisible, onClose }: JoinCampaignModalProps) {
  const [user] = useAtom(userAtom);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const validateCode = (code: string): boolean => {
    // Exactly 6 characters, alphanumeric only
    const codeRegex = /^[A-Za-z0-9]{6}$/;
    return codeRegex.test(code);
  };

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    const formattedCode = text.toUpperCase().slice(0, 6);
    setInviteCode(formattedCode);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    if (debugInfo) {
      setDebugInfo(null);
    }
  };

  const handleTestQuery = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter a code first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // First, let's see all campaigns to debug
      const { data: allCampaigns, error: allError } = await supabase
        .from('campaigns')
        .select('id, name, invite_code, owner, players');

      console.log('All campaigns:', allCampaigns);
      console.log('Looking for code:', inviteCode);

      if (allError) {
        console.error('Error fetching all campaigns:', allError);
        setError(`Database error: ${allError.message}`);
        return;
      }

      // Now try the specific query
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      console.log('Specific campaign query result:', campaign);
      console.log('Query error:', fetchError);

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setDebugInfo(`No campaign found with code "${inviteCode}". Available codes: ${allCampaigns?.map(c => c.invite_code).join(', ') || 'none'}`);
        } else {
          setError(`Query error: ${fetchError.message}`);
        }
        return;
      }

      if (!campaign) {
        setDebugInfo(`Campaign query returned null. Available codes: ${allCampaigns?.map(c => c.invite_code).join(', ') || 'none'}`);
        return;
      }

      setDebugInfo(`Found campaign: "${campaign.name}" (ID: ${campaign.id})`);

    } catch (err) {
      console.error('Test query error:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCampaign = async () => {
    if (!user) {
      setError('You must be logged in to join a campaign');
      return;
    }

    if (!validateCode(inviteCode)) {
      setError('Code must be exactly 6 alphanumeric characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      console.log('Attempting to join with code:', inviteCode);
      console.log('Current user:', user);

      // Query for campaign with matching invite code
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      console.log('Campaign query result:', campaign);
      console.log('Campaign query error:', fetchError);

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Campaign not found. Please check your code and try again.');
        } else {
          setError(`Database error: ${fetchError.message}`);
        }
        return;
      }

      if (!campaign) {
        setError('Campaign not found. Please check your code and try again.');
        return;
      }

      // Check if user is the owner
      if (campaign.owner === user.id) {
        setError('You cannot join your own campaign');
        return;
      }

      // Check if user is already in the campaign
      const existingPlayers = Array.isArray(campaign.players) ? campaign.players : [];
      console.log('Existing players:', existingPlayers);
      
      const isAlreadyMember = existingPlayers.some((player: any) => player.id === user.id);

      if (isAlreadyMember) {
        setError('You are already a member of this campaign');
        return;
      }

      // Add current user to the players array
      const newPlayer = {
        id: user.id,
        name: user.username || user.email || 'Player',
        ready: false,
        avatar: null,
      };

      const updatedPlayers = [...existingPlayers, newPlayer];
      console.log('Updated players array:', updatedPlayers);

      // Update the campaign with the new player
      const { data: updateResult, error: updateError } = await supabase
        .from('campaigns')
        .update({ players: updatedPlayers })
        .eq('id', campaign.id)
        .select();

      console.log('Update result:', updateResult);
      console.log('Update error:', updateError);

      if (updateError) {
        throw updateError;
      }

      // Success! Close modal and redirect to character creation
      onClose();
      setInviteCode('');
      setDebugInfo(null);
      
      Alert.alert(
        'Success!',
        `You've joined "${campaign.name}"! Create your character to get started.`,
        [
          {
            text: 'Create Character',
            onPress: () => router.push('/creation'),
          },
        ]
      );

    } catch (err) {
      console.error('Error joining campaign:', err);
      setError(`Failed to join campaign: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError(null);
    setDebugInfo(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Users size={24} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Join Campaign</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Enter the 6-character invite code to join a campaign
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invite Code</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={inviteCode}
              onChangeText={handleCodeChange}
              placeholder="ABC123"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              editable={!isLoading}
            />
            
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#f44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {debugInfo && (
              <View style={styles.debugContainer}>
                <Search size={16} color="#4CAF50" />
                <Text style={styles.debugText}>{debugInfo}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestQuery}
              disabled={isLoading || !inviteCode.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small\" color="#fff" />
              ) : (
                <>
                  <Search size={16} color="#fff" />
                  <Text style={styles.testButtonText}>Test Query</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.joinButton,
                (!validateCode(inviteCode) || isLoading) && styles.joinButtonDisabled
              ]}
              onPress={handleJoinCampaign}
              disabled={!validateCode(inviteCode) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small\" color="#fff" />
              ) : (
                <>
                  <Users size={20} color="#fff" />
                  <Text style={styles.joinButtonText}>Join</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#f44336',
    marginLeft: 6,
    flex: 1,
  },
  debugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginLeft: 6,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  testButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 100,
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#666',
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
});