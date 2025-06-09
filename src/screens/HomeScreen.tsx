import { router } from 'expo-router';
import { Play, Users, Settings, Menu, Crown, UserCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { useAtom } from 'jotai';
import { campaignsAtom, currentCampaignAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import SidebarMenu from '../components/SidebarMenu';
import JoinCampaignModal from '../components/JoinCampaignModal';

export default function HomeScreen() {
  const [campaigns] = useAtom(campaignsAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [user] = useAtom(userAtom);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleTitlePress = () => {
    // Only navigate to dev screen in development mode
    router.push('/dev');
  };

  const handleJoinCampaign = () => {
    setIsJoinModalVisible(true);
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

  return (
    <ImageBackground
      source={require('../../assets/images/storylines_splash.png')}
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
            <Text style={styles.noCampaigns}>No active campaigns</Text>
          )}
        </View>

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

      <SidebarMenu
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
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
  devIndicator: {
    fontSize: 16,
    color: '#4CAF50',
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
  campaignsContainer: {
    flex: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  noCampaigns: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter-Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  createButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});