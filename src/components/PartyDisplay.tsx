import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useAtom } from 'jotai';
import { fetchCampaignCharactersAtom } from '../atoms/characterAtoms';
import { Campaign } from '../atoms/campaignAtoms';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import CharacterView from './CharacterView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PartyDisplayProps {
  campaign: Campaign;
  currentUserId?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface PartyMember {
  character: any;
  player: any;
  isOnline: boolean;
  isCurrentPlayer: boolean;
}

export default function PartyDisplay({ campaign, currentUserId, isExpanded = false, onToggle }: PartyDisplayProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [campaignCharacters, setCampaignCharacters] = useState<any[]>([]);
  const [, fetchCampaignCharacters] = useAtom(fetchCampaignCharactersAtom);
  const [animation] = useState(new Animated.Value(0));

  // Fetch campaign characters when component mounts or campaign changes
  useEffect(() => {
    const loadCampaignCharacters = async () => {
      if (campaign?.id) {
        try {
          const characters = await fetchCampaignCharacters(campaign.id);
          setCampaignCharacters(characters);
        } catch (error) {
          console.error('Error loading campaign characters:', error);
          setCampaignCharacters([]);
        }
      }
    };

    loadCampaignCharacters();
  }, [campaign?.id, fetchCampaignCharacters]);

  // Sort characters by turn order (wisdom > intelligence > charisma > id)
  const sortedPartyMembers = useMemo(() => {
    if (!campaign.players) return [];

    const ORDER_STATS = ['wisdom', 'intelligence', 'charisma'];
    
    const partyMembers: PartyMember[] = campaign.players.map(player => {
      const character = campaignCharacters.find(char => 
        char.user_id === player.id && char.campaign_id === campaign.id
      );
      
      const isOnline = campaign.players_online?.[player.id] !== undefined;
      const isCurrentPlayer = campaign.current_player === character?.id;
      
      return {
        character,
        player,
        isOnline,
        isCurrentPlayer,
      };
    }); // Show ALL players, even without characters loaded

    // Sort by the same logic as turnManager.js, but handle missing characters
    return partyMembers.sort((a, b) => {
      // If both have characters, sort by stats
      if (a.character && b.character) {
        for (const stat of ORDER_STATS) {
          const aValue = a.character.abilities?.[stat] || 0;
          const bValue = b.character.abilities?.[stat] || 0;
          const diff = bValue - aValue;
          if (diff !== 0) return diff;
        }
        
        // Tie-break by character ID (stable)
        return (a.character.id || '').localeCompare(b.character.id || '');
      }
      
      // If only one has character, prioritize the one with character
      if (a.character && !b.character) return -1;
      if (!a.character && b.character) return 1;
      
      // If neither has character, sort by player name/id
      return (a.player.name || a.player.id || '').localeCompare(b.player.name || b.player.id || '');
    });
  }, [campaign.players, campaignCharacters, campaign.players_online, campaign.current_player, campaign.id]);
  
  // Update animation when isExpanded prop changes
  useEffect(() => {
    const toValue = isExpanded ? 1 : 0;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animation]);

  const handleCharacterPress = (character: any) => {
    setSelectedCharacter(character);
  };

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70], // Adjust based on content height
  });

  if (!sortedPartyMembers.length) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.expandedContent, { height: animatedHeight }]}>
        <ScrollView horizontal>
          <View style={styles.avatarsContainer}>
            {sortedPartyMembers.map((member, index) => (
              <TouchableOpacity
                key={member.character?.id || member.player.id}
                style={[
                  styles.avatarItem,
                  member.isCurrentPlayer && styles.currentPlayerAvatar,
                ]}
                onPress={() => member.character && handleCharacterPress(member.character)}
                activeOpacity={member.character ? 0.8 : 0.4}
                disabled={!member.character}
              >
                <View style={styles.avatarWrapper}>
                  <Image
                    source={member.character ? getCharacterAvatarUrl(member.character) : require('../../assets/images/avatars/bbbjkk.jpg')}
                    style={[
                      styles.avatar,
                      member.isCurrentPlayer && styles.currentPlayer,
                      !member.isOnline && styles.offlineAvatar,
                      !member.character && styles.noCharacterAvatar,
                    ]}
                  />
                  
                  {/* Current player indicator */}
                  {false && member.isCurrentPlayer && (
                    <View style={styles.currentPlayerIndicator}>
                      <View style={styles.currentPlayerDot} />
                    </View>
                  )}
                </View>
                
                <Text 
                  style={[
                    styles.characterName,
                    !member.isOnline && styles.offlineText,
                    !member.character && styles.noCharacterText,
                  ]} 
                  numberOfLines={1}
                >
                  {member.character?.name || member.player.name || 'Player'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Character View Modal */}
      <Modal
        visible={selectedCharacter !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCharacter(null)}
      >
        <View style={styles.modalContainer}>
          {selectedCharacter && (
            <CharacterView
              character={selectedCharacter}
              onClose={() => setSelectedCharacter(null)}
              readonly={true}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  expandedContent: {
    overflow: 'hidden',
  },
  avatarsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  avatarItem: {
    alignItems: 'center',
    width: 60
    //maxWidth: (SCREEN_WIDTH - 32 - 48) / 4, // Adjust for 4 avatars per row
  },
  currentPlayerAvatar: {
    transform: [{ scale: 1.05 }],
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  offlineAvatar: {
    opacity: 0.6,
    borderColor: '#999',
  },
  currentPlayer: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  currentPlayerIndicator: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    right: -2,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlayerDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFB000',
  },
  characterName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2a2a2a',
    textAlign: 'center',
    marginBottom: 2,
  },
  offlineText: {
    color: '#999',
  },
  noCharacterAvatar: {
    opacity: 0.4,
    borderColor: '#999',
  },
  noCharacterText: {
    color: '#999',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
}); 