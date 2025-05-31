import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Storylines</Text>
      
      <View style={styles.campaignsContainer}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        {/* Campaign list will go here */}
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateCampaign')}
      >
        <Text style={styles.buttonText}>Create Campaign</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.joinButton}
        onPress={() => {/* Handle join via code */}}
      >
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
});