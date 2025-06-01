import { router } from 'expo-router';
import { Play, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function HomeScreen() {

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Storylines</Text>
      
      <View style={styles.campaignsContainer}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        <View style={styles.campaignCard}>
          <Text style={styles.campaignTitle}>The Goblin Caves</Text>
          <Text style={styles.campaignDetails}>Players: 4 • In Progress</Text>
          <TouchableOpacity style={styles.continueButton}>
            <Play size={20} color="#fff" />
            <Text style={styles.buttonText}>Continue Story!</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  campaignsContainer: {
    flex: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  campaignTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  campaignDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  campaignCard: {
    backgroundColor: '#1E1E1E',
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
});