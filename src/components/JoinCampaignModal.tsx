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
import { X, Users } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { supabase } from '../config/supabase';
import { userAtom } from '../atoms/authAtoms';
import { fetchCampaignsAtom } from '../atoms/campaignAtoms';
import { router } from 'expo-router';

interface JoinCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function JoinCampaignModal({ isVisible, onClose }: JoinCampaignModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAtom(userAtom);
  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);

  const validateCode = (code: string): boolean => {
    // Must be exactly 6 characters and alphanumeric
    const codeRegex = /^[A-Za-z0-9]{6}$/;
    return codeRegex.test(code);
  };

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    const upperText = text.toUpperCase().slice(0, 6);
    setInviteCode(upperText);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const testQuery = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Testing database query...');
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('campaigns')
        .select('id, name, invite_code')
        .limit(5);

      if (testError) {
        console.error('Test query error:', testError);
        setError(`Database error: ${testError.message}`);
        return;
      }

      console.log('Available campaigns:', testData);
      
      // Test specific code query
      if (inviteCode && validateCode(inviteCode)) {
        const { data: codeData, error: codeError } = await supabase
          .from('campaigns')
          .select('id, name, invite_code, players, owner')
          .eq('invite_code', inviteCode)
          .maybeSingle();

        if (codeError) {
          console.error('Code query error:', codeError);
          setError(`Query error: ${codeError.message}`);
        } else if (!codeData) {
          setError(`No campaign found with code "${inviteCode}". Available codes: ${testData?.map(c => c.invite_code).join(', ') || 'none'}`);
        } else {
          console.log('Found campaign:', codeData);
          setError(`Campaign found: ${codeData.name}`);
        }
      } else {
        setError(`Available codes: ${testData?.map(c => c.invite_code).join(', ') || 'none'}`);
      }

    } catch (err) {
      console.error('Test query exception:', err);
      setError(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCampaign = async () => {
    if (!validateCode(inviteCode)) {
      setError('Please enter a valid 6-character code');
      return;
    }

    if (!user) {
      setError('You must be logged in to join a campaign');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Attempting to join campaign with code:', inviteCode);

      // Query campaign by invite code
      const { data: campaign, error: queryError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (queryError) {
        console.error('Campaign query error:', queryError);
        setError(`Database error: ${queryError.message}`);
        return;
      }

      if (!campaign) {
        setError('Campaign not found. Please check the invite code.');
        return;
      }

      console.log('Found campaign:', campaign);

      // Check if user is already in the campaign
      const currentPlayers = campaign.players || [];
      const isAlreadyMember = currentPlayers.some((player: any) => player.id === user.id);

      if (isAlreadyMember) {
        setError('You are already a member of this campaign');
        return;
      }

      // Add user to campaign players
      const newPlayer = {
        id: user.id,
        name: user.username || user.email || 'Player',
        ready: false,
      };

      const updatedPlayers = [...currentPlayers, newPlayer];

      // Update campaign with new player
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ players: updatedPlayers })
        .eq('id', campaign.id);

      if (updateError) {
        console.error('Campaign update error:', updateError);
        setError(`Failed to join campaign: ${updateError.message}`);
        return;
      }

      console.log('Successfully joined campaign');

      // Refresh campaigns list
      await fetchCampaigns();

      // Close modal and navigate
      onClose();
      setInviteCode('');
      
      // Navigate to character creation or campaign view
      router.push('/creation');

    } catch (err) {
      console.error('Join campaign exception:', err);
      setError(`Failed to join campaign: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Campaign</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Users size={48} color="#4CAF50" />
            </View>

            <Text style={styles.description}>
              Enter the 6-character invite code to join a campaign
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  error && styles.inputError,
                  inviteCode.length === 6 && validateCode(inviteCode) && styles.inputValid
                ]}
                value={inviteCode}
                onChangeText={handleCodeChange}
                placeholder="ABC123"
                placeholderTextColor="#666"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Text style={styles.inputHelper}>
                {inviteCode.length}/6 characters
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.testButton,
                  isLoading && styles.buttonDisabled
                ]}
                onPress={testQuery}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small\" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Test Query</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (!validateCode(inviteCode) || isLoading) && styles.buttonDisabled
                ]}
                onPress={handleJoinCampaign}
                disabled={!validateCode(inviteCode) || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small\" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Join Campaign</Text>
                )}
              </TouchableOpacity>
            </View>
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
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#f44336',
  },
  inputValid: {
    borderColor: '#4CAF50',
  },
  inputHelper: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#f44336',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
});