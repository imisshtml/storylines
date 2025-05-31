import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Play, Users } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storylines</Text>
      
      <ScrollView style={styles.campaignsContainer}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        <View style={styles.campaignCard}>
          <Text style={styles.campaignTitle}>The Goblin Caves</Text>
          <Text style={styles.campaignDetails}>Players: 4 • In Progress</Text>
          <TouchableOpacity style={styles.continueButton}>
            <Play size={20} color="#fff" />
            <Text style={styles.buttonText}>Continue Story</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    backgroundColor: '#121212',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  campaignsContainer: {
    flex: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#fff',
    marginBottom: 15,
  },
  campaignCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  continueButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Inter-Regular',
    color: 'white',
    fontSize: 16,
  },
});