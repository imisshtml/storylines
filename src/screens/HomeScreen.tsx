import { router } from 'expo-router';
import { Play, Users, Settings, LogOut } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { useAtom } from 'jotai';
import { campaignsAtom, currentCampaignAtom } from '../atoms/campaignAtoms';
import { signOutAtom, userAtom } from '../atoms/authAtoms';

export default function HomeScreen() {
  const [campaigns] = useAtom(campaignsAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [user] = useAtom(userAtom);
  const [, signOut] = useAtom(signOutAtom);

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

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/storylines_splash.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.logo}>Storylines</Text>
            {user && (
              <Text style={styles.welcomeText}>
                Welcome back, {user.username || user.email}!
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.campaignsContainer}>
          <Text style={styles.sectionTitle}>Campaigns Happening Now!</Text>
          {campaigns.map(campaign => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignTitle}>{campaign.name}</Text>
                {campaign.status === 'creation' && (
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
                    <Text style={styles.buttonText}>Invite Friends</Text>
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
          onPress={() => router.push('/join')}
        >
          <Users size={20} color="#fff" />
          <Text style={styles.buttonText}>Join via Code</Text>
        </TouchableOpacity>
      </View>
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
    marginVertical: 20,
  },
  titleContainer: {
    marginTop: 20,
    flex: 1,
    alignItems: 'center',
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
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    position: 'absolute',
    right: 0,
    bottom: 0,
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
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  campaignTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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