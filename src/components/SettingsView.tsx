import React from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { supabase } from '../config/supabase';

export default function SettingsView() {
  const [user] = useAtom(userAtom);

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) {
                Alert.alert('Error', 'User not found');
                return;
              }

              // Call backend to properly delete account (hard delete auth user, fallback to soft delete)
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/account`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }

              Alert.alert('Success', 'Account deleted successfully');
            } catch (error) {
              Alert.alert('Error', `Failed to delete account: ${error}`);
            }
          }
        }
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.text}>Settings screen content coming soon...</Text>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>DELETE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Inter-Regular',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
}); 