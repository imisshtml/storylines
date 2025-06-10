import { router } from 'expo-router';
import { Play, Users, Settings, Menu, Crown, UserCheck, User, Sword } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground, ScrollView, Image } from 'react-native';
import { useAtom } from 'jotai';
import { campaignsAtom, currentCampaignAtom } from '../atoms/campaignAtoms';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import SidebarMenu from '../components/SidebarMenu';
import JoinCampaignModal from '../components/JoinCampaignModal';

export default function HomeScreen() {
  const [campaigns] = useAtom(campaignsAtom);
  const [characters] = useAtom(charactersAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [user] = useAtom(userAtom);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);

  // Fetch characters when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchCharacters();
    }
  }, [user, fetchCharacters]);

  const handleCampaignPress = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setCurrentCampaign(campaign);
      if (campaign.status === 'creation') {
        router.push('/invite');
      } else {
        // Handle other campaign states
        router.push('/story');
      }
    }
  };

  const handleSettingsPress = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setCurrentCampaign(campaign);
      router.push('/create');
    }
  };

  const handleCharacterPress = (character: Character) => {
    // For now, just navigate to character creation to view/edit
    // In the future, this could open a character sheet view
    router.push('/creation');
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleTitlePress = () => {
    // Only navigate to dev screen in development mode
    if (__DEV__) {
      router.push('/dev');
    }
  };

  const handleJoinCampaign = () => {
    setIsJoinModalVisible(true);
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

  // Helper function to check if user is the owner of a campaign
  const isOwner = (campaign: any) => {
    return user && campaign.owner === user.id;
  };

  // Helper function to get user's role in campaign
  const getUserRole = (campaign: any) => {
    if (isOwner(campaign)) return 'Owner';
    return 'Player';
  };

  // Check if user is currently in any active campaigns
  const isInActiveCampaign = () => {
    return campaigns.some(campaign => 
      campaign.status !== 'creation' && (
        isOwner(campaign) || 
        campaign.players.some((player: any) => player.id === user?.id)
      )
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/storylines_splash.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <TouchableOpacity
              onPress={handleTitlePress}
              disabled={!__DEV__}
            >
              <Text style={styles.logo}>
                Storylines
              </Text>
            </TouchableOpacity>
            {user && (
              <Text style={styles.welcomeText}>
                Welcome back, {user.username || user.email}!
              </Text>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.campaignsContainer}>
            <Text style={styles.sectionTitle}>My Campaigns</Text>
            {campaigns.map(campaign => (
              <View key={campaign.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <View style={styles.campaignTitleRow}>
                    <Text style={styles.campaignTitle}>{campaign.name}</Text>
                    <View style={styles.roleContainer}>
                      {isOwner(campaign) ? (
                        <Crown size={16} color="#FFD700" />
                      ) : (
                        <UserCheck size={16} color="#4CAF50" />
                      )}
                      <Text style={[
                        styles.roleText,
                        isOwner(campaign) ? styles.ownerText : styles.playerText
                      ]}>
                        {getUserRole(campaign)}
                      </Text>
                    </View>
                  </View>
                  {campaign.status === 'creation' && isOwner(campaign) && (
                    <TouchableOpacity
                      style={styles.settingsButton}
                      onPress={() => handleSettingsPress(campaign.id)}
                    >
                      <Settings size={20} color="#888" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.campaignDetails}>
                  {campaign.status === 'creation'
                    ? 'In Creation'
                    : `Players: ${campaign.players.length} • ${campaign.status === 'waiting' ? 'Waiting' : 'In Progress'}`
                  }
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => handleCampaignPress(campaign.id)}
                >
                  {campaign.status === 'creation' ? (
                    <>
                      <Users size={20} color="#fff" />
                      <Text style={styles.buttonText}>
                        {isOwner(campaign) ? 'Invite Friends' : 'Waiting for Start'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Play size={20} color="#fff" />
                      <Text style={styles.buttonText}>Continue Story</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {campaigns.length === 0 && (
              <View style={styles.noCampaignsContainer}>
                <Text style={styles.noCampaigns}>No active campaigns</Text>
                <Text style={styles.noCampaignsSubtext}>
                  Create a new campaign or join an existing one to start your adventure!
                </Text>
              </View>
            )}

            {/* Show campaign action buttons only if user is not in an active campaign */}
            {!isInActiveCampaign() && (
              <View style={styles.campaignActionButtons}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/create')}
                >
                  <Text style={styles.buttonText}>Create Campaign</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={handleJoinCampaign}
                >
                  <Users size={20} color="#fff" />
                  <Text style={styles.buttonText}>Join via Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.charactersContainer}>
            <Text style={styles.sectionTitle}>My Characters</Text>
            {characters.length > 0 ? (
              <View style={styles.charactersGrid}>
                {characters.map(character => (
                  <TouchableOpacity
                    key={character.id}
                    style={styles.characterCard}
                    onPress={() => handleCharacterPress(character)}
                  >
                    <View style={styles.characterAvatarContainer}>
                      <Image
                        source={{ uri: getCharacterAvatar(character) }}
                        style={styles.characterAvatar}
                      />
                      <View style={styles.characterLevelBadge}>
                        <Text style={styles.characterLevel}>{character.level}</Text>
                      </View>
                    </View>
                    <View style={styles.characterInfo}>
                      <Text style={styles.characterName} numberOfLines={1}>
                        {character.name}
                      </Text>
                      <Text style={styles.characterClass} numberOfLines={1}>
                        {character.race} {character.class}
                      </Text>
                    </View>
                    <View style={styles.characterIcon}>
                      <Sword size={16} color="#4CAF50" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noCharactersContainer}>
                <User size={48} color="#666" />
                <Text style={styles.noCharacters}>No characters created yet</Text>
                <Text style={styles.noCharactersSubtext}>
                  Create your first D&D character to begin your adventures!
                </Text>
                <TouchableOpacity
                  style={styles.createCharacterButton}
                  onPress={() => router.push('/creation')}
                >
                  <Text style={styles.createCharacterButtonText}>Create Your First Character</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <SidebarMenu
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        onJoinCampaign={handleJoinCampaign}
      />

      <JoinCampaignModal
        isVisible={isJoinModalVisible}
        onClose={() => setIsJoinModalVisible(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  campaignsContainer: {
    marginBottom: 30,
  },
  charactersContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  noCampaignsContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  noCampaigns: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  noCampaignsSubtext: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  campaignCard: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  campaignTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  campaignTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  ownerText: {
    color: '#FFD700',
  },
  playerText: {
    color: '#4CAF50',
  },
  settingsButton: {
    padding: 4,
  },
  campaignDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  continueButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  campaignActionButtons: {
    gap: 12,
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  characterCard: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  characterAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  characterLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  characterLevel: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  characterInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  characterName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  characterClass: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
  },
  characterIcon: {
    alignItems: 'center',
  },
  noCharactersContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  noCharacters: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noCharactersSubtext: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createCharacterButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createCharacterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  createButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  joinButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});