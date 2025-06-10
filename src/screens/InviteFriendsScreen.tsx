import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, ActivityIndicator, TextInput, SafeAreaView, Modal, Image } from 'react-native';
import { useAtom } from 'jotai';
import { currentCampaignAtom, campaignsLoadingAtom, campaignsErrorAtom, upsertCampaignAtom } from '../atoms/campaignAtoms';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { Copy, Share as ShareIcon, Users, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ArrowLeft, Send, ChevronDown, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as SMS from 'expo-sms';
import { supabase } from '../config/supabase';

export default function InviteFriendsScreen() {
  const [currentCampaign, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [isLoading] = useAtom(campaignsLoadingAtom);
  const [error] = useAtom(campaignsErrorAtom);
  const [, upsertCampaign] = useAtom(upsertCampaignAtom);
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [copied, setCopied] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState<string | null>(null);

  useEffect(() => {
    if (!currentCampaign) {
      router.replace('/');
    }
    checkSmsAvailability();
    if (user) {
      fetchCharacters();
    }
  }, [currentCampaign, user, fetchCharacters]);

  const checkSmsAvailability = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    setSmsAvailable(isAvailable);
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleCopyCode = async () => {
    if (!currentCampaign) return;
    await Clipboard.setStringAsync(currentCampaign.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!currentCampaign) return;
    try {
      await Share.share({
        message: `Join my Storylines campaign! Use code: ${currentCampaign.invite_code}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartCampaign = async () => {
    if (!currentCampaign) return;
    try {
      await upsertCampaign({
        ...currentCampaign,
        status: 'waiting',
      });
      router.replace('/story');
    } catch (err) {
      console.error('Error starting campaign:', err);
    }
  };

  const handleSendSMS = async () => {
    if (!currentCampaign || !phoneNumbers.trim()) return;

    const numbers = phoneNumbers.split(',').map(num => num.trim()).filter(Boolean);
    if (numbers.length === 0) return;

    try {
      const { result } = await SMS.sendSMSAsync(
        numbers,
        `Join me on Storylines! Use my invite code ${currentCampaign.invite_code} and download the app here: https://linkTBD`
      );
      
      if (result === 'sent') {
        setPhoneNumbers('');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  const getPlayerCharacter = (playerId: string): Character | null => {
    // Find character assigned to this campaign for this player
    return characters.find(char => 
      char.campaign_id === currentCampaign?.uid && 
      char.user_id === playerId
    ) || null;
  };

  const getAvailableCharacters = (playerId: string): Character[] => {
    if (!user) return [];
    
    // Only show user's own characters if they are the player
    if (playerId !== user.id) return [];
    
    // Filter characters that are not assigned to any campaign or assigned to this campaign
    return characters.filter(char => 
      char.user_id === user.id && (!char.campaign_id || char.campaign_id === currentCampaign?.uid)
    );
  };

  const getCharacterAvatar = (character: Character) => {
    // Try to get avatar from character_data, fallback to a default fantasy portrait
    const avatar = character.character_data?.avatar;
    if (avatar) {
      return avatar;
    }
    
    // Use different default avatars based on class
    const classAvatars: { [key: string]: string } = {
      'Fighter': 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Wizard': 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Rogue': 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Cleric': 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Ranger': 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400',
    };
    
    return classAvatars[character.class] || classAvatars['Fighter'];
  };

  const handleCharacterSelect = async (playerId: string, characterId: string | null) => {
    if (!user || !currentCampaign || playerId !== user.id) {
      console.error('Invalid user or campaign state:', {
        hasUser: !!user,
        hasCampaign: !!currentCampaign,
        playerId,
        userId: user?.id
      });
      return;
    }

    try {
      // Use the authenticated user's ID instead of the player ID from campaign data
      const userId = user.id;
      console.log('Debug - IDs:', {
        playerId,
        userId,
        characterId,
        campaignId: currentCampaign.uid
      });

      // First, remove any existing character assignment for this player in this campaign
      const existingCharacter = getPlayerCharacter(userId);
      console.log('Debug - Existing character:', existingCharacter);

      if (existingCharacter) {
        console.log('Debug - Removing character:', {
          characterId: existingCharacter.id,
          userId,
          campaignId: currentCampaign.uid
        });

        const { error: removeError } = await supabase
          .from('characters')
          .update({ campaign_id: null })
          .eq('id', existingCharacter.id)
          .eq('user_id', userId);

        if (removeError) {
          console.error('Error removing existing character:', removeError);
          throw removeError;
        }
      }

      let selectedCharacter: Character | null = null;

      if (characterId) {
        // Log available characters for debugging
        console.log('Debug - Available characters:', characters.map(c => ({
          id: c.id,
          userId: c.user_id,
          name: c.name
        })));

        // Validate that the character exists and belongs to the user
        const characterToAssign = characters.find(char => 
          char.id === characterId && char.user_id === userId
        );

        console.log('Debug - Character to assign:', characterToAssign);

        if (!characterToAssign) {
          console.error('Character not found or does not belong to user');
          throw new Error('Character not found or access denied');
        }

        console.log('Debug - Assigning character:', {
          characterId: characterToAssign.id,
          userId,
          campaignId: currentCampaign.uid
        });

        // Assign new character to campaign
        const { error: assignError } = await supabase
          .from('characters')
          .update({ campaign_id: currentCampaign.uid })
          .eq('id', characterToAssign.id)
          .eq('user_id', userId);

        if (assignError) {
          console.error('Error assigning character:', assignError);
          throw assignError;
        }

        selectedCharacter = characterToAssign;
      }

      // Log current campaign players before update
      console.log('Debug - Current campaign players:', currentCampaign.players);

      // Update the campaign's players array with character information
      const updatedPlayers = currentCampaign.players.map(player => {
        if (player.id === playerId) {
          console.log('Debug - Updating player:', {
            playerId: player.id,
            characterInfo: selectedCharacter ? {
              id: selectedCharacter.id,
              name: selectedCharacter.name,
              class: selectedCharacter.class,
              race: selectedCharacter.race,
              level: selectedCharacter.level,
            } : null
          });
          return {
            ...player,
            character: selectedCharacter ? {
              id: selectedCharacter.id,
              name: selectedCharacter.name,
              class: selectedCharacter.class,
              race: selectedCharacter.race,
              level: selectedCharacter.level,
            } : null,
          };
        }
        return player;
      });

      console.log('Debug - Updated players:', updatedPlayers);

      // Update the campaign in the database
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ players: updatedPlayers })
        .eq('id', currentCampaign.id);

      if (campaignError) {
        console.error('Error updating campaign:', campaignError);
        throw campaignError;
      }

      // Update local campaign state
      setCurrentCampaign({
        ...currentCampaign,
        players: updatedPlayers,
      });

      // Refresh characters
      await fetchCharacters();
      setShowCharacterSelector(null);

      console.log('Character assignment completed successfully');
    } catch (error) {
      console.error('Error updating character assignment:', error);
      // You might want to show an alert to the user here
    }
  };

  // Check if all players have characters assigned
  const allPlayersHaveCharacters = () => {
    if (!currentCampaign || currentCampaign.players.length === 0) return false;
    
    return currentCampaign.players.every(player => {
      const playerCharacter = getPlayerCharacter(player.id);
      return playerCharacter !== null;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!currentCampaign) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Campaign not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={handleBack} style={styles.touchable} />
          <ArrowLeft color="#fff" size={24} />
        </View>
        <Text style={styles.title}>{currentCampaign.name}</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color="#f44336" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Invite Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{currentCampaign.invite_code}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            {copied ? (
              <CheckCircle2 size={24} color="#4CAF50" />
            ) : (
              <Copy size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <ShareIcon size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Share Invite Link</Text>
      </TouchableOpacity>

      {smsAvailable && (
        <View style={styles.smsContainer}>
          <Text style={styles.smsLabel}>Send SMS Invite</Text>
          <View style={styles.smsInputContainer}>
            <TextInput
              style={styles.smsInput}
              value={phoneNumbers}
              onChangeText={setPhoneNumbers}
              placeholder="Enter phone numbers (comma-separated)"
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              style={[styles.smsButton, !phoneNumbers && styles.smsButtonDisabled]}
              onPress={handleSendSMS}
              disabled={!phoneNumbers}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.playersContainer}>
        <Text style={styles.playersLabel}>
          Players ({currentCampaign.players.length})
        </Text>
        <ScrollView style={styles.playersList}>
          {currentCampaign.players.map((player, index) => {
            const playerCharacter = getPlayerCharacter(player.id);
            const availableCharacters = getAvailableCharacters(player.id);
            const canSelectCharacter = player.id === user?.id && availableCharacters.length > 0;
            
            return (
              <View key={player.id} style={styles.playerItem}>
                <View style={styles.playerRow}>
                  <View style={styles.playerInfo}>
                    <Users size={20} color="#4CAF50" />
                    <Text style={styles.playerName}>{player.name || `Player ${index + 1}`}</Text>
                    {player.ready && (
                      <CheckCircle2 size={20} color="#4CAF50" style={styles.readyIcon} />
                    )}
                  </View>
                  
                  <View style={styles.characterInfo}>
                    {playerCharacter ? (
                      <TouchableOpacity
                        style={styles.selectedCharacterContainer}
                        onPress={() => canSelectCharacter ? setShowCharacterSelector(player.id) : undefined}
                        disabled={!canSelectCharacter}
                      >
                        <Image 
                          source={{ uri: getCharacterAvatar(playerCharacter) }} 
                          style={styles.characterAvatar}
                        />
                        <View style={styles.characterDetails}>
                          <Text style={styles.selectedCharacterText}>
                            {playerCharacter.name}
                          </Text>
                          <Text style={styles.selectedCharacterSubtext}>
                            Lv{playerCharacter.level} {playerCharacter.race} {playerCharacter.class}
                          </Text>
                        </View>
                        {canSelectCharacter && (
                          <ChevronDown size={16} color="#4CAF50" style={styles.chevronIcon} />
                        )}
                      </TouchableOpacity>
                    ) : canSelectCharacter ? (
                      <TouchableOpacity
                        style={styles.selectCharacterButton}
                        onPress={() => setShowCharacterSelector(player.id)}
                      >
                        <Text style={styles.selectCharacterText}>Select Character</Text>
                        <ChevronDown size={16} color="#888" />
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noCharacterText}>No Character</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          !allPlayersHaveCharacters() && styles.startButtonDisabled
        ]}
        onPress={handleStartCampaign}
        disabled={!allPlayersHaveCharacters()}
      >
        <Text style={styles.startButtonText}>
          {!allPlayersHaveCharacters()
            ? 'Waiting for Characters...'
            : 'Start Campaign'}
        </Text>
      </TouchableOpacity>

      {/* Character Selection Modal */}
      <Modal
        visible={showCharacterSelector !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCharacterSelector(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Character</Text>
              <TouchableOpacity onPress={() => setShowCharacterSelector(null)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {showCharacterSelector && getAvailableCharacters(showCharacterSelector).map((character) => (
                <TouchableOpacity
                  key={character.id}
                  style={styles.characterOption}
                  onPress={() => handleCharacterSelect(showCharacterSelector, character.id)}
                >
                  <Image 
                    source={{ uri: getCharacterAvatar(character) }} 
                    style={styles.modalCharacterAvatar}
                  />
                  <View style={styles.characterOptionInfo}>
                    <Text style={styles.characterOptionName}>{character.name}</Text>
                    <Text style={styles.characterOptionDetails}>
                      Level {character.level} {character.race} {character.class}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {showCharacterSelector && getPlayerCharacter(showCharacterSelector) && (
                <TouchableOpacity
                  style={styles.removeCharacterOption}
                  onPress={() => handleCharacterSelect(showCharacterSelector, null)}
                >
                  <Text style={styles.removeCharacterText}>Remove Character</Text>
                </TouchableOpacity>
              )}
              {showCharacterSelector && getAvailableCharacters(showCharacterSelector).length === 0 && (
                <View style={styles.noCharactersAvailable}>
                  <Text style={styles.noCharactersText}>No characters available</Text>
                  <Text style={styles.noCharactersSubtext}>
                    Create a character first to assign to this campaign
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#121212',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 16,
  },
  touchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f443361a',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  codeContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  codeLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    flex: 1,
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  smsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  smsLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  smsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smsInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  smsButton: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsButtonDisabled: {
    backgroundColor: '#666',
  },
  playersContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
  },
  playersLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  readyIcon: {
    marginLeft: 8,
  },
  characterInfo: {
    alignItems: 'flex-end',
  },
  selectedCharacterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  characterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  characterDetails: {
    alignItems: 'flex-end',
  },
  selectedCharacterText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  selectedCharacterSubtext: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  selectCharacterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#666',
    gap: 4,
  },
  selectCharacterText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  noCharacterText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#666',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  modalBody: {
    padding: 20,
  },
  characterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  modalCharacterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  characterOptionInfo: {
    flex: 1,
  },
  characterOptionName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  characterOptionDetails: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  removeCharacterOption: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  removeCharacterText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  noCharactersAvailable: {
    alignItems: 'center',
    padding: 20,
  },
  noCharactersText: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  noCharactersSubtext: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});