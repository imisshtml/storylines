import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { ArrowLeft, User, Mail, Calendar, Crown, Users, UserX, Bell, BellOff, Volume2, VolumeX, Trash2, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { userAtom, signOutAtom } from '../atoms/authAtoms';
import { campaignsAtom } from '../atoms/campaignAtoms';
import { supabase } from '../config/supabase';
import { useCustomAlert } from '../components/CustomAlert';

export default function ProfileScreen() {
  const [user] = useAtom(userAtom);
  const [campaigns] = useAtom(campaignsAtom);
  const [, signOut] = useAtom(signOutAtom);
  const { showAlert, hideAlert } = useCustomAlert();
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [turnNotifications, setTurnNotifications] = useState(true);
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    createdAt: '',
    campaignsCompleted: 0,
    ignoredUsers: 0,
    purchases: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Get user profile data including creation date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Count completed campaigns (campaigns where user was a participant and status is completed)
      const completedCampaigns = campaigns.filter(campaign => 
        campaign.status === 'completed' && 
        (campaign.owner === user.id || 
         campaign.players.some((player: any) => player.id === user.id))
      ).length;

      setProfileData({
        createdAt: profile?.created_at || '',
        campaignsCompleted: completedCampaigns,
        ignoredUsers: 0, // This would need a separate table for blocked/ignored users
        purchases: 0, // This would integrate with RevenueCat or payment system
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your characters, campaigns, and data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ],
      'warning'
    );
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Delete user account - this will cascade delete related data due to foreign key constraints
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw error;
      }

      // Sign out and redirect to login
      await signOut();
      router.replace('/login');
      
      showAlert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        undefined,
        'success'
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      showAlert(
        'Delete Failed',
        'Failed to delete your account. Please try again or contact support.',
        undefined,
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.androidSafeArea]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Account & Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <User size={20} color="#4CAF50" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{user.username || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#4CAF50" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color="#4CAF50" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{formatDate(profileData.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Crown size={24} color="#FFD700" />
              <Text style={styles.statValue}>{profileData.campaignsCompleted}</Text>
              <Text style={styles.statLabel}>Campaigns Completed</Text>
            </View>

            <View style={styles.statItem}>
              <Shield size={24} color="#2196F3" />
              <Text style={styles.statValue}>{profileData.purchases}</Text>
              <Text style={styles.statLabel}>Purchases</Text>
            </View>

            <View style={styles.statItem}>
              <UserX size={24} color="#ff4444" />
              <Text style={styles.statValue}>{profileData.ignoredUsers}</Text>
              <Text style={styles.statLabel}>Ignored Users</Text>
            </View>
          </View>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIcon}>
                {pushNotifications ? (
                  <Bell size={20} color="#4CAF50" />
                ) : (
                  <BellOff size={20} color="#666" />
                )}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications for campaign updates and messages
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#2a2a2a', true: '#4CAF50' }}
              thumbColor={pushNotifications ? '#fff' : '#666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIcon}>
                {turnNotifications ? (
                  <Volume2 size={20} color="#4CAF50" />
                ) : (
                  <VolumeX size={20} color="#666" />
                )}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Turn Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get notified when it's your turn in a campaign
                </Text>
              </View>
            </View>
            <Switch
              value={turnNotifications}
              onValueChange={setTurnNotifications}
              trackColor={{ false: '#2a2a2a', true: '#4CAF50' }}
              thumbColor={turnNotifications ? '#fff' : '#666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIcon}>
                <Mail size={20} color={receiveEmails ? '#4CAF50' : '#666'} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive campaign updates and announcements via email
                </Text>
              </View>
            </View>
            <Switch
              value={receiveEmails}
              onValueChange={setReceiveEmails}
              trackColor={{ false: '#2a2a2a', true: '#4CAF50' }}
              thumbColor={receiveEmails ? '#fff' : '#666'}
            />
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <Text style={styles.dangerSectionTitle}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Trash2 size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.deleteWarning}>
            This action is permanent and cannot be undone. All your data will be lost.
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 50 : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
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
    marginRight: 40, // Compensate for back button
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ff4444',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  deleteWarning: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});