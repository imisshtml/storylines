import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
} from 'react-native';
import { ChevronDown, ChevronUp, Users, Shield, Heart, Sword, X } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import { Character } from '../atoms/characterAtoms';
import CharacterView from './CharacterView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.4;
const DRAG_THRESHOLD = 50;

interface PartyMemberViewerProps {
  campaignId: string;
  currentUserId: string;
  currentCharacter: Character | null;
}

export default function PartyMemberViewer({
  campaignId,
  currentUserId,
  currentCharacter,
}: PartyMemberViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [partyMembers, setPartyMembers] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCharacterSheetVisible, setIsCharacterSheetVisible] = useState(false);
  
  const panY = useRef(new Animated.Value(0)).current;
  const translateY = panY.interpolate({
    inputRange: [-PANEL_HEIGHT, 0, 1],
    outputRange: [-PANEL_HEIGHT, 0, 0],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down when expanded, or dragging up when collapsed
        if ((isExpanded && gestureState.dy > 0) || (!isExpanded && gestureState.dy < 0)) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isExpanded) {
          // If dragging down when expanded
          if (gestureState.dy > DRAG_THRESHOLD) {
            closePanel();
          } else {
            resetPanel();
          }
        } else {
          // If dragging up when collapsed
          if (gestureState.dy < -DRAG_THRESHOLD) {
            openPanel();
          } else {
            resetPanel();
          }
        }
      },
    })
  ).current;

  const openPanel = () => {
    setIsExpanded(true);
    Animated.spring(panY, {
      toValue: -PANEL_HEIGHT,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  };

  const closePanel = () => {
    setIsExpanded(false);
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  };

  const resetPanel = () => {
    Animated.spring(panY, {
      toValue: isExpanded ? -PANEL_HEIGHT : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  };

  const togglePanel = () => {
    if (isExpanded) {
      closePanel();
    } else {
      openPanel();
    }
  };

  const fetchPartyMembers = async () => {
    if (!campaignId) return;
    
    setIsLoading(true);
    try {
      // Fetch campaign to get player IDs
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('players')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      
      if (!campaign || !campaign.players || campaign.players.length <= 1) {
        // Solo campaign or no players
        setPartyMembers([]);
        return;
      }

      // Extract player IDs, excluding current user
      const playerIds = campaign.players
        .map((player: any) => player.id)
        .filter((id: string) => id !== currentUserId);

      if (playerIds.length === 0) {
        setPartyMembers([]);
        return;
      }

      // Fetch characters for these players in this campaign
      const { data: characters, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('user_id', playerIds);

      if (charactersError) throw charactersError;
      
      setPartyMembers(characters || []);
    } catch (error) {
      console.error('Error fetching party members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartyMembers();
  }, [campaignId, currentUserId]);

  const handleCharacterPress = (character: Character) => {
    setSelectedCharacter(character);
    setIsCharacterSheetVisible(true);
  };

  // Don't render anything for solo campaigns
  if (partyMembers.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.handleContainer}
          onPress={togglePanel}
          activeOpacity={0.7}
        >
          <Users size={16} color="#4CAF50" />
          <Text style={styles.handleText}>Party Members ({partyMembers.length})</Text>
          {isExpanded ? (
            <ChevronDown size={16} color="#4CAF50" />
          ) : (
            <ChevronUp size={16} color="#4CAF50" />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.panelHeader}>
            <View style={styles.panelHandle} />
            <Text style={styles.panelTitle}>Your Party</Text>
          </View>

          <ScrollView 
            style={styles.partyList}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.partyListContent}
          >
            {/* Current character card */}
            {currentCharacter && (
              <View style={[styles.characterCard, styles.currentCharacterCard]}>
                <View style={styles.characterAvatarContainer}>
                  <Image
                    source={getCharacterAvatarUrl(currentCharacter)}
                    style={styles.characterAvatar}
                  />
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>YOU</Text>
                  </View>
                </View>
                <Text style={styles.characterName} numberOfLines={1}>
                  {currentCharacter.name}
                </Text>
                <Text style={styles.characterClass} numberOfLines={1}>
                  {currentCharacter.race} {currentCharacter.class}
                </Text>
                <View style={styles.characterStats}>
                  <View style={styles.statItem}>
                    <Heart size={12} color="#E91E63" />
                    <Text style={styles.statText}>
                      {currentCharacter.current_hitpoints}/{currentCharacter.max_hitpoints}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Shield size={12} color="#2196F3" />
                    <Text style={styles.statText}>
                      {currentCharacter.armor_class}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Party member cards */}
            {partyMembers.map((character) => (
              <TouchableOpacity
                key={character.id}
                style={styles.characterCard}
                onPress={() => handleCharacterPress(character)}
                activeOpacity={0.7}
              >
                <View style={styles.characterAvatarContainer}>
                  <Image
                    source={getCharacterAvatarUrl(character)}
                    style={styles.characterAvatar}
                  />
                </View>
                <Text style={styles.characterName} numberOfLines={1}>
                  {character.name}
                </Text>
                <Text style={styles.characterClass} numberOfLines={1}>
                  {character.race} {character.class}
                </Text>
                <View style={styles.characterStats}>
                  <View style={styles.statItem}>
                    <Heart size={12} color="#E91E63" />
                    <Text style={styles.statText}>
                      {character.current_hitpoints}/{character.max_hitpoints}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Shield size={12} color="#2196F3" />
                    <Text style={styles.statText}>
                      {character.armor_class}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Character Sheet Modal */}
      <Modal
        visible={isCharacterSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCharacterSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.sheetHeader}>
                {selectedCharacter && (
                  <>
                    <Text style={styles.characterSheetName}>{selectedCharacter.name}</Text>
                    <Text style={styles.characterSheetClass}>
                      Level {selectedCharacter.level} {selectedCharacter.race} {selectedCharacter.class}
                    </Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setIsCharacterSheetVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {selectedCharacter && (
              <CharacterView character={selectedCharacter} isViewOnly={true} />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignSelf: 'center',
    gap: 8,
    marginHorizontal: 20,
  },
  handleText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  panelHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  partyList: {
    flex: 1,
  },
  partyListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  characterCard: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 12,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  currentCharacterCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  characterAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  characterAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  currentBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  characterName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  characterClass: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 8,
    textAlign: 'center',
  },
  characterStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sheetHeader: {
    flex: 1,
  },
  characterSheetName: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  characterSheetClass: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
});