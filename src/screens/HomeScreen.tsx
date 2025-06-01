import { router } from 'expo-router';
import { Play, Users, Settings } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAtom } from 'jotai';
import { campaignsAtom, currentCampaignAtom } from '../atoms/campaignAtoms';

export default function HomeScreen() {
  const [campaigns] = useAtom(campaignsAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);

  const handleCampaignPress = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setCurrentCampaign(campaign);
      if (campaign.status === 'creation') {
        router.push('/invite');
      } else {
        // Handle other campaign states
        router.push('/play');
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

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Storylines</Text>
      
      <View style={styles.campaignsContainer}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
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
  },
  noCampaigns: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter-Regular',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  },
  settingsButton: {
    padding: 4,
  },
  campaignDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  campaignCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});