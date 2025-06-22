import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { ArrowLeft, Plus, Star, Crown, Users, Sword, Shield, UserPlus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import { campaignsAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import ActivityIndicator from '../components/ActivityIndicator';
import { useLoading } from '../hooks/useLoading';

export default function CharactersScreen() {
  const [characters] = useAtom(charactersAtom);
  const [campaigns] = useAtom(campaignsAtom);
  const [user] = useAtom(userAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const { isLoading, withLoading } = useLoading();

  useEffect(() => {
    const loadCharacters = async () => {
      if (user) {
        try {
          await withLoading(fetchCharacters, 'fetchCharacters')();
        } catch (error) {
          console.error('Error loading characters:', error);
        }
      }
    };

    loadCharacters();
  }, [user, fetchCharacters, withLoading]);

  const handleBack = () => {
    router.back();
  };

  const handleCharacterPress = (character: Character) => {
    router.push({
      pathname: '/character-view',
      params: { characterId: character.id }
    });
  };

  const handleCreateCharacter = () => {
    router.push('/creation');
  };

  const getCharacterCampaignName = (character: Character) => {
    if (character.campaign_id) {
      // Find the campaign by campaign_id (which should match campaign.id)
      const campaign = campaigns.find(c => c.uid === character.campaign_id);
      return campaign ? campaign.name : 'Unknown Campaign';
    }
    return 'No Campaign';
  };

  const getCharacterCampaignStatus = (character: Character) => {
    if (character.campaign_id) {
      const campaign = campaigns.find(c => c.uid === character.campaign_id);
      if (campaign) {
        return {
          name: campaign.name,
          status: campaign.status,
          isOwner: campaign.owner === user?.id
        };
      }
    }
    return null;
  };

  const renderCharacterCard = (character: Character) => {
    const campaignInfo = getCharacterCampaignStatus(character);

    return (
      <TouchableOpacity
        key={character.id}
        style={styles.characterCard}
        onPress={() => handleCharacterPress(character)}
        activeOpacity={0.8}
      >
        {/* Character Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={getCharacterAvatarUrl(character)}
            style={styles.characterAvatar}
          />
          <View style={styles.levelBadge}>
            <Star size={12} color="#fff" />
            <Text style={styles.levelText}>{character.level}</Text>
          </View>
        </View>

        {/* Character Info */}
        <View style={styles.characterInfo}>
          <Text style={styles.characterName} numberOfLines={1}>
            {character.name}
          </Text>

          <View style={styles.classRaceContainer}>
            <Text style={styles.classRaceText}>
              {character.race} {character.class}
            </Text>
          </View>

          {/* Campaign Info */}
          <View style={styles.campaignContainer}>
            {campaignInfo ? (
              <View style={styles.campaignInfo}>
                <View style={styles.campaignHeader}>
                  {campaignInfo.isOwner ? (
                    <Crown size={14} color="#FFD700" />
                  ) : (
                    <Users size={14} color="#4CAF50" />
                  )}
                  <Text style={styles.campaignName} numberOfLines={1}>
                    {campaignInfo.name}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  (campaignInfo.status === 'creation' || campaignInfo.status === 'open') && styles.creationStatus,
                  campaignInfo.status === 'waiting' && styles.waitingStatus,
                  campaignInfo.status === 'in_progress' && styles.activeStatus,
                ]}>
                  <Text style={styles.statusText}>
                    {campaignInfo.status === 'creation' ? 'Setup' :
                      campaignInfo.status === 'waiting' ? 'Waiting' : 'Active'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noCampaignContainer}>
                <Text style={styles.noCampaignText}>Available for Campaign</Text>
              </View>
            )}
          </View>

          {/* Character Stats Preview */}
          <View style={styles.statsPreview}>
            <View style={styles.statItem}>
              <Shield size={12} color="#2196F3" />
              <Text style={styles.statText}>AC {character.armor_class || 10}</Text>
            </View>
            <View style={styles.statItem}>
              <Sword size={12} color="#f44336" />
              <Text style={styles.statText}>HP {character.current_hitpoints || 0}/{character.max_hitpoints || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>My Characters</Text>
        <TouchableOpacity onPress={handleCreateCharacter} style={styles.createButton}>
          <UserPlus color="#4CAF50" size={24} />
        </TouchableOpacity>
      </View>

      <ActivityIndicator
        isLoading={isLoading('fetchCharacters')}
        text="Loading characters..."
        style={styles.content}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {characters.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Users size={64} color="#666" />
              </View>
              <Text style={styles.emptyTitle}>No Characters Yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first 5e character to begin your adventure!
              </Text>
              <TouchableOpacity
                style={styles.createFirstCharacterButton}
                onPress={handleCreateCharacter}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.createFirstCharacterText}>Create Character</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.headerInfo}>
                <Text style={styles.characterCount}>
                  {characters.length} Character{characters.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.headerSubtext}>
                  Tap a character to view details and manage spells
                </Text>
              </View>

              <View style={styles.charactersGrid}>
                {characters.map(renderCharacterCard)}
              </View>
            </>
          )}
        </ScrollView>
      </ActivityIndicator>
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
    backgroundColor: '#121212',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerInfo: {
    marginBottom: 20,
  },
  characterCount: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  charactersGrid: {
    gap: 16,
  },
  characterCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  characterAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    minWidth: 32,
    justifyContent: 'center',
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  classRaceContainer: {
    marginBottom: 8,
  },
  classRaceText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
  },
  campaignContainer: {
    marginBottom: 12,
  },
  campaignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  campaignName: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#666',
  },
  creationStatus: {
    backgroundColor: '#FFA726',
  },
  waitingStatus: {
    backgroundColor: '#2196F3',
  },
  activeStatus: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  noCampaignContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  noCampaignText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  statsPreview: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  createFirstCharacterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createFirstCharacterText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});