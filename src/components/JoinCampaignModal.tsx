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
import { X, Users, AlertCircle } from 'lucide-react-native';
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

    try {
      // Query for campaign with matching invite code
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (fetchError || !campaign) {
        setError('Campaign not found. Please check your code and try again.');
        return;
      }

      // Check if user is already in the campaign
      const existingPlayers = campaign.players || [];
      const isAlreadyMember = existingPlayers.some((player: any) => player.id === user.id);

      if (isAlreadyMember) {
        setError('You are already a member of this campaign');
        return;
      }

      // Check if user is the owner
      if (campaign.owner === user.id) {
        setError('You cannot join your own campaign');
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

      // Update the campaign with the new player
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ players: updatedPlayers })
        .eq('id', campaign.id);

      if (updateError) {
        throw updateError;
      }

      // Success! Close modal and redirect to character creation
      onClose();
      setInviteCode('');
      
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
      setError('Failed to join campaign. Please try again.');
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
          </View>

          <View style={styles.buttonContainer}>
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
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Users size={20} color="#fff" />
                  <Text style={styles.joinButtonText}>Join Campaign</Text>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
    flex: 2,
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