import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Modal,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useAtom } from 'jotai';
import { currentCampaignAtom, campaignsLoadingAtom, campaignsErrorAtom, upsertCampaignAtom } from '../atoms/campaignAtoms';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import { Copy, Share as ShareIcon, Users, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ArrowLeft, Send, ChevronDown, ChevronUp, X, Plus, Crown, Info } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as SMS from 'expo-sms';
import { supabase } from '../config/supabase';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import { ADVENTURES } from '../components/AdventureSelectSheet';

export default function InviteFriendsScreen() {
  const [currentCampaign, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [isLoading] = useAtom(campaignsLoadingAtom);
  const [error] = useAtom(campaignsErrorAtom);
  const [, upsertCampaign] = useAtom(upsertCampaignAtom);
  const [user] = useAtom(userAtom);
  const [characters] = useAtom(charactersAtom);
  const [campaignCharacters, setCampaignCharacters] = useState<Character[]>([]);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [copied, setCopied] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState<string | null>(null);
  const [isInviteSectionOpen, setIsInviteSectionOpen] = useState(false);

  useEffect(() => {
    if (!currentCampaign) {
      router.replace('/');
    }
    checkSmsAvailability();
    if (user) {
      fetchCharacters();
      fetchCampaignCharacters();
    }
  }, [currentCampaign, user, fetchCharacters]);

  const fetchCampaignCharacters = useCallback(async () => {
    if (!currentCampaign) return;

    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', currentCampaign.uid);

      if (error) {
        console.error('Error fetching campaign characters:', error);
        return;
      }

      setCampaignCharacters(data || []);
    } catch (error) {
      console.error('Error fetching campaign characters:', error);
    }
  }, [currentCampaign]);

  // Set up real-time subscription for campaign and character updates
  useEffect(() => {
    if (!currentCampaign || !user) return;

    const channelName = `invite-screen-${currentCampaign.id}-${Date.now()}`;

    const subscription = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${currentCampaign.id}`,
        },
        (payload) => {
          if (payload.new) {
            setTimeout(async () => {
              try {
                const { data: freshCampaign, error } = await supabase
                  .from('campaigns')
                  .select('*')
                  .eq('id', currentCampaign.id)
                  .single();

                if (!error && freshCampaign) {
                  setCurrentCampaign(freshCampaign as any);
                }
              } catch (error) {
                console.error('Error updating campaign from real-time:', error);
              }
            }, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${currentCampaign.uid}`,
        },
        (payload) => {
          setTimeout(() => {
            fetchCampaignCharactersRef.current();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      const cleanup = async () => {
        try {
          await subscription.unsubscribe();
          supabase.removeChannel(subscription);
        } catch (error) {
          console.error('Error during subscription cleanup:', error);
        }
      };
      cleanup();
    };
  }, [currentCampaign?.id, user?.id, setCurrentCampaign]);

  const checkSmsAvailability = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    setSmsAvailable(isAvailable);
  };

  // Use refs to store latest functions for subscription callbacks
  const fetchCharactersRef = useRef(fetchCharacters);
  const fetchCampaignCharactersRef = useRef(fetchCampaignCharacters);

  // Update refs when functions change
  useEffect(() => {
    fetchCharactersRef.current = fetchCharacters;
    fetchCampaignCharactersRef.current = fetchCampaignCharacters;
  }, [fetchCharacters, fetchCampaignCharacters]);

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

  const getPlayerCharacter = useCallback((playerId: string): Character | null => {
    const character = campaignCharacters.find(char => char.user_id === playerId);
    return character || null;
  }, [campaignCharacters]);

  const getAvailableCharacters = (playerId: string): Character[] => {
    if (!user) return [];

    // Only show user's own characters if they are the player
    if (playerId !== user.id) return [];

    // Filter characters that are not assigned to any campaign (campaign_id is null)
    // This ensures each character can only be in one campaign at a time
    return characters.filter(char =>
      char.user_id === user.id && !char.campaign_id
    );
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
      const userId = user.id;

      // First, remove any existing character assignment for this player in this campaign
      const existingCharacter = getPlayerCharacter(userId);

      if (existingCharacter) {
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
        // Validate that the character exists and belongs to the user
        const characterToAssign = characters.find(char =>
          char.id === characterId && char.user_id === userId
        );

        if (!characterToAssign) {
          console.error('Character not found or does not belong to user');
          throw new Error('Character not found or access denied');
        }

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

      // Update the campaign's players array with character information
      const updatedPlayers = currentCampaign.players.map(player => {
        if (player.id === playerId) {
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
      await fetchCampaignCharacters();
      setShowCharacterSelector(null);
    } catch (error) {
      console.error('Error updating character assignment:', error);
    }
  };

  const handleCreateCharacter = () => {
    // Close the character selector modal first
    setShowCharacterSelector(null);

    // Store the current campaign in a way that the creation flow can access it
    // We'll use router params to pass the campaign info
    router.push({
      pathname: '/creation',
      params: {
        returnToCampaign: currentCampaign?.id || '',
        campaignUid: currentCampaign?.uid || '',
      }
    });
  };

  // Check if all players have characters assigned
  const allPlayersHaveCharacters = useMemo(() => {
    if (!currentCampaign || currentCampaign.players.length === 0) {
      return false;
    }

    // Check that every player has a character assigned to this campaign
    const result = currentCampaign.players.every(player => {
      const playerCharacter = getPlayerCharacter(player.id);
      const hasCharacter = playerCharacter !== null;
      return hasCharacter;
    });

    return result;
  }, [currentCampaign, getPlayerCharacter, campaignCharacters]);

  // Check if current user is the campaign owner
  const isOwner = useMemo(() => {
    const result = user && currentCampaign && currentCampaign.owner === user.id;
    return result;
  }, [user, currentCampaign]);

  // Determine minimum players required (assuming 2 is minimum)
  const minimumPlayers = 1;
  const hasEnoughPlayers = currentCampaign ? currentCampaign.players.length >= minimumPlayers : false;

  // Determine button state and text
  const getButtonState = () => {
    if (!currentCampaign) return { disabled: true, text: 'Loading...', canStart: false };

    if (isOwner) {
      // Owner can start if there are enough players and all have characters
      if (!hasEnoughPlayers) {
        return {
          disabled: true,
          text: `Waiting for Players (${currentCampaign.players.length}/${minimumPlayers})`,
          canStart: false
        };
      }
      if (!allPlayersHaveCharacters) {
        return {
          disabled: true,
          text: 'Waiting for Characters...',
          canStart: false
        };
      }
      return {
        disabled: false,
        text: 'Start Campaign',
        canStart: true
      };
    } else {
      // Non-owners see waiting messages
      if (!hasEnoughPlayers) {
        return {
          disabled: true,
          text: `Waiting for Players (${currentCampaign.players.length}/${minimumPlayers})`,
          canStart: false
        };
      }
      if (!allPlayersHaveCharacters) {
        return {
          disabled: true,
          text: 'Waiting for Characters...',
          canStart: false
        };
      }
      return {
        disabled: true,
        text: 'Waiting for DM to Start',
        canStart: false
      };
    }
  };

  const buttonState = getButtonState();

  // Get adventure details
  const getAdventureDetails = () => {
    if (!currentCampaign) return null;
    return ADVENTURES.find(adventure => adventure.id === currentCampaign.adventure);
  };

  const adventureDetails = getAdventureDetails();

  // Format content level display
  const getContentLevelDisplay = (level: string) => {
    const levels = {
      'kids': 'Kids Friendly',
      'teens': 'Teen Appropriate',
      'adults': 'Mature Content'
    };
    return levels[level as keyof typeof levels] || level;
  };

  // Format RP focus display
  const getRpFocusDisplay = (focus: string) => {
    const focuses = {
      'heavy_rp': 'Heavy Roleplay',
      'rp_focused': 'Roleplay Focused',
      'balanced': 'Balanced',
      'combat_focused': 'Combat Focused',
      'heavy_combat': 'Heavy Combat'
    };
    return focuses[focus as keyof typeof focuses] || focus;
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Players Section */}
        <View style={styles.playersContainer}>
          <Text style={styles.playersLabel}>
            Players
          </Text>
          <Text style={styles.realtimeIndicator}>
            Updates automatically when players join
          </Text>
          <View style={styles.playersList}>
            {currentCampaign.players.map((player, index) => {
              const playerCharacter = getPlayerCharacter(player.id);
              const availableCharacters = getAvailableCharacters(player.id);
              const canSelectCharacter = player.id === user?.id;

              return (
                <View key={player.id} style={styles.playerItem}>
                  <View style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                      {player.id === currentCampaign.owner ? (
                        <Crown size={20} color="#FFD700" />
                      ) : (
                        <Users size={20} color="#4CAF50" />
                      )}
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
                            source={getCharacterAvatarUrl(playerCharacter)}
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
          </View>
        </View>
        {/* Collapsible Invite Players Section */}
        <View style={styles.inviteSection}>
          <TouchableOpacity 
            style={styles.inviteSectionHeader}
            onPress={() => setIsInviteSectionOpen(!isInviteSectionOpen)}
          >
            <Text style={styles.inviteSectionTitle}>Invite New Players</Text>
            {isInviteSectionOpen ? (
              <ChevronUp size={24} color="#fff" />
            ) : (
              <ChevronDown size={24} color="#fff" />
            )}
          </TouchableOpacity>

          {isInviteSectionOpen && (
            <View style={styles.inviteContent}>
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
            </View>
          )}
        </View>

        {/* Campaign Details Section */}
        <View style={styles.campaignDetailsSection}>
          <View style={styles.sectionHeader}>
            <Info size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Campaign Details</Text>
          </View>

          {adventureDetails && (
            <View style={styles.adventureCard}>
              <Text style={styles.adventureTitle}>{adventureDetails.title}</Text>
              <Text style={styles.adventureDescription}>{adventureDetails.description}</Text>
            </View>
          )}

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tone</Text>
              <Text style={styles.detailValue}>
                {currentCampaign.tone.charAt(0).toUpperCase() + currentCampaign.tone.slice(1)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Content Level</Text>
              <Text style={styles.detailValue}>
                {getContentLevelDisplay(currentCampaign.content_level)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Focus</Text>
              <Text style={styles.detailValue}>
                {getRpFocusDisplay(currentCampaign.rp_focus)}
              </Text>
            </View>

            {currentCampaign.exclude && currentCampaign.exclude.length > 0 && (
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Excluded Content</Text>
                <View style={styles.excludedTags}>
                  {currentCampaign.exclude.map((tag, index) => (
                    <View key={index} style={styles.excludedTag}>
                      <Text style={styles.excludedTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.startButton,
          buttonState.disabled && styles.startButtonDisabled
        ]}
        onPress={buttonState.canStart ? handleStartCampaign : undefined}
        disabled={buttonState.disabled}
      >
        <Text style={styles.startButtonText}>
          {buttonState.text}
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
              {/* Create Character Button */}
              <TouchableOpacity
                style={styles.createCharacterOption}
                onPress={handleCreateCharacter}
              >
                <View style={styles.createCharacterIcon}>
                  <Plus size={24} color="#4CAF50" />
                </View>
                <View style={styles.characterOptionInfo}>
                  <Text style={styles.createCharacterText}>Create New Character</Text>
                  <Text style={styles.createCharacterSubtext}>
                    Build a new character for this campaign
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Available Characters */}
              {showCharacterSelector && getAvailableCharacters(showCharacterSelector).map((character) => (
                <TouchableOpacity
                  key={character.id}
                  style={styles.characterOption}
                  onPress={() => handleCharacterSelect(showCharacterSelector, character.id)}
                >
                  <Image
                    source={getCharacterAvatarUrl(character)}
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

              {/* Remove Character Option */}
              {showCharacterSelector && getPlayerCharacter(showCharacterSelector) && (
                <TouchableOpacity
                  style={styles.removeCharacterOption}
                  onPress={() => handleCharacterSelect(showCharacterSelector, null)}
                >
                  <Text style={styles.removeCharacterText}>Remove Character</Text>
                </TouchableOpacity>
              )}

              {/* No Characters Available Message */}
              {showCharacterSelector && getAvailableCharacters(showCharacterSelector).length === 0 && !getPlayerCharacter(showCharacterSelector) && (
                <View style={styles.noCharactersAvailable}>
                  <Text style={styles.noCharactersText}>No available characters</Text>
                  <Text style={styles.noCharactersSubtext}>
                    All your characters are assigned to other campaigns. Create a new character or remove one from another campaign first.
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
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
  content: {
    flex: 1,
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
  inviteSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inviteSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#333',
  },
  inviteSectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  inviteContent: {
    padding: 16,
  },
  codeContainer: {
    marginBottom: 16,
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
    backgroundColor: '#1a1a1a',
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
    marginBottom: 16,
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
    marginBottom: 8,
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
    backgroundColor: '#1a1a1a',
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
  campaignDetailsSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  adventureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  adventureTitle: {
    fontSize: 18,
    color: '#4CAF50',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  adventureDescription: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: '45%',
  },
  fullWidth: {
    minWidth: '100%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  excludedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  excludedTag: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  excludedTagText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  playersContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    //marginBottom: 20,
  },
  playersLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  realtimeIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
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
  createCharacterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  createCharacterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createCharacterText: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  createCharacterSubtext: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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
    lineHeight: 20,
  },
});