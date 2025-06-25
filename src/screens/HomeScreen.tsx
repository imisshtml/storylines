import { router } from 'expo-router';
import { Play, Users, Settings, Menu, Crown, UserCheck, Star, Circle, Bell, Plus, UserPlus } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground, ScrollView, Image, Linking } from 'react-native';
import { useAtom } from 'jotai';
import { campaignsAtom, currentCampaignAtom, fetchCampaignsAtom } from '../atoms/campaignAtoms';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import { userAtom } from '../atoms/authAtoms';
import {
  fetchCampaignReadStatusAtom,
  updateCampaignReadStatusAtom,
  initializeCampaignReadStatusRealtimeAtom
} from '../atoms/campaignReadStatusAtoms';
import {
  campaignInvitationsAtom,
  fetchCampaignInvitationsAtom,
  respondToCampaignInvitationAtom,
  friendRequestsReceivedAtom,
  fetchFriendRequestsReceivedAtom,
  respondToFriendRequestAtom,
} from '../atoms/friendsAtoms';
import SidebarMenu from '../components/SidebarMenu';
import JoinCampaignModal from '../components/JoinCampaignModal';
import { useCustomAlert } from '../components/CustomAlert';
import { initializeNotificationListeners, requestNotificationPermissions } from '../utils/notifications';
import ActivityIndicator from '../components/ActivityIndicator';
import { useLoading } from '../hooks/useLoading';
import { useLimitEnforcement } from '../hooks/useLimitEnforcement';
import { useLevelUpNotification } from '../hooks/useLevelUpNotification';
import CharacterLevelUpNotification from '../components/CharacterLevelUpNotification';
import LevelUpBadge from '../components/LevelUpBadge';

export default function HomeScreen() {
  const [campaigns] = useAtom(campaignsAtom);
  const [characters] = useAtom(charactersAtom);
  const [campaignInvitations] = useAtom(campaignInvitationsAtom);
  const [friendRequestsReceived] = useAtom(friendRequestsReceivedAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [, fetchCampaignReadStatus] = useAtom(fetchCampaignReadStatusAtom);
  const [, updateCampaignReadStatus] = useAtom(updateCampaignReadStatusAtom);
  const [, initializeReadStatusRealtime] = useAtom(initializeCampaignReadStatusRealtimeAtom);
  const [, fetchCampaignInvitations] = useAtom(fetchCampaignInvitationsAtom);
  const [, respondToCampaignInvitation] = useAtom(respondToCampaignInvitationAtom);
  const [, fetchFriendRequestsReceived] = useAtom(fetchFriendRequestsReceivedAtom);
  const [, respondToFriendRequest] = useAtom(respondToFriendRequestAtom);
  const [user] = useAtom(userAtom);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const { showAlert } = useCustomAlert();
  const { isLoading, withLoading } = useLoading();
  const { checkCampaignLimit } = useLimitEnforcement();
  const { 
    showNotification: showLevelUpNotification, 
    dismissNotification: dismissLevelUpNotification,
    charactersToLevelUp
  } = useLevelUpNotification();

  // Fetch characters and read status when component mounts or user changes
  useEffect(() => {
    if (user) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchCampaigns(),
            fetchCharacters(),
            fetchCampaignReadStatus(),
            fetchCampaignInvitations(),
            fetchFriendRequestsReceived(),
          ]);
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      };

      withLoading(loadInitialData, 'initialLoad')();

      // Initialize real-time subscription for read status
      initializeReadStatusRealtime();

      // Initialize notification listeners
      const cleanupNotifications = initializeNotificationListeners();

      // Request notification permissions
      requestNotificationPermissions().catch(error => {
        console.log('Error requesting notification permissions:', error);
      });

      return () => {
        if (typeof cleanupNotifications === 'function') {
          cleanupNotifications();
        }
      };
    }
  }, [user, fetchCampaigns, fetchCharacters, fetchCampaignReadStatus, fetchCampaignInvitations, fetchFriendRequestsReceived, initializeReadStatusRealtime, withLoading]);

  const handleCampaignPress = async (campaignId: string) => {
    console.log('🎯 CAMPAIGN PRESS - Starting navigation');
    console.log('🎯 Campaign ID:', campaignId);
    console.log('🎯 Available campaigns:', campaigns.length);
    
    const campaign = campaigns.find(c => c.id === campaignId);
    console.log('🎯 Found campaign:', campaign ? campaign.name : 'NOT FOUND');
    console.log('🎯 Campaign status:', campaign?.status);
    
    if (campaign) {
      console.log('🎯 Setting current campaign...');
      setCurrentCampaign(campaign);

      // Mark campaign as read when entering it
      if (campaign.latest_message_id) {
        try {
          console.log('🎯 Updating read status...');
          await updateCampaignReadStatus({
            campaignId: campaign.id,
            messageId: campaign.latest_message_id,
          });
        } catch (error) {
          console.error('Error updating read status:', error);
        }
      }

      if (campaign.status === 'creation' || campaign.status === 'open') {
        console.log('🎯 Navigating to /invite for status:', campaign.status);
        router.push('/invite');
      } else {
        console.log('🎯 Navigating to /story for status:', campaign.status);
        router.push('/story');
      }
    } else {
      console.error('🎯 Campaign not found with ID:', campaignId);
    }
  };

  const handleSettingsPress = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    console.log('::: C ', campaignId, campaigns, campaign)
    if (campaign) {
      setCurrentCampaign(campaign);
      router.push('/create');
    }
  };

  const handleCharacterPress = (character: Character) => {
    router.push({
      pathname: '/character-view',
      params: { characterId: character.id }
    });
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleBoltPress = async () => {
    try {
      const url = 'https://bolt.new/';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleJoinCampaign = () => {
    router.push('/join')
  };

  const handleAcceptCampaignInvitation = async (invitationId: string) => {
    try {
      await respondToCampaignInvitation({ invitationId, response: 'accepted' });
      showAlert(
        'Campaign Invitation Accepted',
        'You have joined the campaign! Redirecting to campaign setup...',
        [
          {
            text: 'OK',
            onPress: () => router.push('/invite'),
          },
        ],
        'success'
      );
    } catch (error) {
      showAlert('Error', 'Failed to accept campaign invitation. Please try again.', undefined, 'error');
    }
  };

  const handleDeclineCampaignInvitation = async (invitationId: string) => {
    try {
      await respondToCampaignInvitation({ invitationId, response: 'rejected' });
      showAlert('Campaign Invitation Declined', 'You have declined the campaign invitation.', undefined, 'success');
    } catch (error) {
      showAlert('Error', 'Failed to decline campaign invitation. Please try again.', undefined, 'error');
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      await respondToFriendRequest({ friendshipId, response: 'accepted' });
      showAlert('Friend Request Accepted', 'You are now friends!', undefined, 'success');
    } catch (error) {
      showAlert('Error', 'Failed to accept friend request. Please try again.', undefined, 'error');
    }
  };

  const handleDeclineFriendRequest = async (friendshipId: string) => {
    try {
      await respondToFriendRequest({ friendshipId, response: 'rejected' });
      showAlert('Friend Request Declined', 'You have declined the friend request.', undefined, 'success');
    } catch (error) {
      showAlert('Error', 'Failed to decline friend request. Please try again.', undefined, 'error');
    }
  };

  const handleCreateCharacter = async () => {
    router.push('/creation');
  };

  const handleCreateCampaign = async () => {
    const canCreate = await checkCampaignLimit();
    if (canCreate) {
      // Clear current campaign data to ensure new campaign starts fresh
      setCurrentCampaign(null);
      // Small delay to ensure state is cleared before navigation
      setTimeout(() => {
        router.push('/create');
      }, 50);
    }
  };

  const getCharacterAvatar = (character: Character) => {
    // Try to get avatar from character
    const avatarUrl = character.avatar;

    if (avatarUrl && typeof avatarUrl === 'string') {
      // Check if it's a default avatar reference
      if (avatarUrl.startsWith('default:')) {
        const { getAvatarById } = require('../data/defaultAvatars');
        const avatarId = avatarUrl.replace('default:', '');
        const defaultAvatar = getAvatarById(avatarId);
        return defaultAvatar ? defaultAvatar.imagePath : require('../data/defaultAvatars').DEFAULT_AVATARS[0].imagePath;
      }

      // Return URL as-is for uploaded images
      return { uri: avatarUrl };
    }

    // Fallback to first default avatar
    const { DEFAULT_AVATARS } = require('../data/defaultAvatars');
    return DEFAULT_AVATARS[0].imagePath;
  };

  const getCharacterCampaignName = (character: Character) => {
    if (character.campaign_id) {
      // Find the campaign by campaign_id (which should match campaign.id)
      const campaign = campaigns.find(c => c.uid === character.campaign_id);
      return campaign ? campaign.name : 'Unknown Campaign';
    }
    return 'No Campaign Set';
  };

  const getCharacterForCampaign = (campaignId: string) => {
    return characters.find(character => character.campaign_id === campaignId);
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
    // Only check campaigns that the user should legitimately have access to
    (
      isOwner(campaign) ||
      (campaign.players && campaign.players.some((player: any) => player.id === user?.id))
    )
    );
  };

  // Check if a character has leveled up
  const hasLeveledUp = (character: Character) => {
    return charactersToLevelUp.some(c => c.id === character.id);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/storylines_splash.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <ActivityIndicator
        isLoading={isLoading('initialLoad')}
        fullScreen
        text="Loading your adventures..."
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Menu size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Image source={require('../../assets/images/sl_logo_small3.png')} style={styles.logoImg} resizeMode='contain' />
              {user && (
                <Text style={styles.welcomeText}>
                  Welcome back!!, {user.username || user.email}!
                </Text>
              )}
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.campaignsContainer}>
              <ScrollView 
                style={styles.campaignsScrollView} 
                contentContainerStyle={styles.campaignsScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Characters Section */}
                {characters.length === 0 && (
                  <>
                    <View style={styles.noCampaignsContainer}>
                      <Text style={styles.noCampaigns}>No Characters</Text>
                      <Text style={styles.noCampaignsSubtext}>
                        Create a new character to play in a 5e Adventure!
                      </Text>
                    </View>
                    <View style={styles.characterActionButton}>
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateCharacter}
                      >
                        <UserPlus size={20} color="#fff" style={styles.gap} />
                        <Text style={styles.buttonText}>Create Character</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.divider}/>
                  </>
                )}
                {characters.length > 0 && (
                  <View style={styles.charactersSection}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.charactersScrollContent}
                    >
                      {characters.map(character => (
                        <TouchableOpacity
                          key={character.id}
                          style={styles.characterCard}
                          onPress={() => handleCharacterPress(character)}
                        >
                          <View style={styles.characterAvatarContainer}>
                            <Image
                              source={getCharacterAvatar(character)}
                              style={[
                                styles.characterAvatar,
                                character.retired && styles.retiredCharacterAvatar
                              ]}
                            />
                            <View style={[
                              styles.characterLevelBadge,
                              character.retired && styles.retiredCharacterLevelBadge
                            ]}>
                              <Star size={8} color="#fff" fill="#fff" />
                              <Text style={styles.characterLevel}>
                                {character.level || 1}
                              </Text>
                            </View>
                            
                            {/* Level Up Badge - don't show for retired characters */}
                            {hasLeveledUp(character) && !character.retired && (
                              <LevelUpBadge 
                                visible={true}
                                size="small"
                                style={styles.levelUpBadge}
                              />
                            )}
                          </View>
                          <View style={styles.characterInfo}>
                            <Text style={styles.characterName} numberOfLines={1}>
                              {character.name || 'Unnamed'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Campaign Invitations Banner */}
                {campaignInvitations.length > 0 && (
                  <View style={styles.invitationsBanner}>
                    <View style={styles.invitationsHeader}>
                      <Bell size={20} color="#FFD700" />
                      <Text style={styles.invitationsTitle}>
                        Campaign Invitation{campaignInvitations.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {campaignInvitations.map((invitation) => (
                        <View key={invitation.id} style={styles.invitationCard}>
                          <Text style={styles.invitationCampaignName}>
                            {invitation.campaign?.name}
                          </Text>
                          <Text style={styles.invitationFrom}>
                            From {invitation.inviter_profile?.username}
                          </Text>
                          <View style={styles.invitationActions}>
                            <TouchableOpacity
                              style={styles.acceptInvitationButton}
                              onPress={() => handleAcceptCampaignInvitation(invitation.id)}
                            >
                              <Text style={styles.invitationButtonText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.declineInvitationButton}
                              onPress={() => handleDeclineCampaignInvitation(invitation.id)}
                            >
                              <Text style={styles.invitationButtonText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Friend Requests Banner */}
                {friendRequestsReceived.length > 0 && (
                  <View style={styles.friendRequestsBanner}>
                    <View style={styles.friendRequestsHeader}>
                      <UserPlus size={20} color="#4CAF50" />
                      <Text style={styles.friendRequestsTitle}>
                        Friend Request{friendRequestsReceived.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {friendRequestsReceived.map((request) => (
                        <View key={request.id} style={styles.friendRequestCard}>
                          <Text style={styles.friendRequestUsername}>
                            {request.friend_profile?.username}
                          </Text>
                          <Text style={styles.friendRequestEmail}>
                            {request.friend_profile?.email}
                          </Text>
                          <View style={styles.friendRequestActions}>
                            <TouchableOpacity
                              style={styles.acceptFriendRequestButton}
                              onPress={() => handleAcceptFriendRequest(request.id)}
                            >
                              <Text style={styles.friendRequestButtonText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.declineFriendRequestButton}
                              onPress={() => handleDeclineFriendRequest(request.id)}
                            >
                              <Text style={styles.friendRequestButtonText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {campaigns
                  .filter(campaign =>
                    // Double-check: only show campaigns where user is owner or player
                    isOwner(campaign) ||
                    (campaign.players && campaign.players.some((player: any) => player.id === user?.id))
                  )
                  .sort((a, b) => {
                    // Sort so completed/failed campaigns appear at the bottom
                    const aIsCompleted = a.status === 'completed' || a.status === 'failed';
                    const bIsCompleted = b.status === 'completed' || b.status === 'failed';
                    
                    if (aIsCompleted && !bIsCompleted) return 1;
                    if (!aIsCompleted && bIsCompleted) return -1;
                    return 0; // Keep original order for campaigns of same completion status
                  })
                  .map(campaign => (
                    <View key={campaign.id} style={styles.campaignCard}>
                      {/* Notification dot positioned absolutely in top-right corner */}
                      {campaign.has_unread && (
                        <View style={styles.notificationDot}>
                          <Circle size={8} color="#4CAF50" fill="#4CAF50" />
                        </View>
                      )}

                      <View style={styles.campaignHeader}>
                        <View style={styles.campaignTitleRow}>
                          <View style={styles.campaignTitleContainer}>
                            <Text style={styles.campaignTitle}>{campaign.name}</Text>
                          </View>
                          {(() => {
                            const campaignCharacter = getCharacterForCampaign(campaign.id);
                            return campaignCharacter ? (
                              <View style={styles.characterAvatarWrapper}>
                                <Image
                                  source={getCharacterAvatar(campaignCharacter)}
                                  style={[
                                    styles.campaignHeaderAvatar,
                                    campaignCharacter.retired && styles.retiredCampaignHeaderAvatar
                                  ]}
                                />
                                {/* Level Up Badge for campaign character - don't show for retired characters */}
                                {hasLeveledUp(campaignCharacter) && !campaignCharacter.retired && (
                                  <LevelUpBadge 
                                    visible={true}
                                    size="small"
                                    style={styles.campaignCharacterLevelUpBadge}
                                  />
                                )}
                              </View>
                            ) : null;
                          })()}
                        </View>
                      </View>
                      <Text style={styles.campaignDetails}>
                        {isOwner(campaign) && (
                          <View style={styles.crownSpace}>
                            <Crown size={14} color="#FFD700" />
                          </View>
                        )}
                        {(() => {
                          if (campaign.status === 'creation' || campaign.status === 'open') {
                            return `Players: ${campaign.players.length}/${campaign.limit} • Waiting to Start`;
                          } else if (campaign.status === 'completed') {
                            return `Players: ${campaign.players.length} • Completed`;
                          } else if (campaign.status === 'failed') {
                            return `Players: ${campaign.players.length} • Failed`;
                          } else if (campaign.status === 'waiting') {
                            return `Players: ${campaign.players.length} • Waiting`;
                          } else {
                            return `Players: ${campaign.players.length} • In Progress`;
                          }
                        })()}
                      </Text>
                      {(() => {
                        // Don't show buttons for completed or failed campaigns
                        if (campaign.status === 'completed' || campaign.status === 'failed') {
                          return null;
                        }
                        
                        // Show creation buttons for campaigns in creation/open status and user is owner
                        if ((campaign.status === 'creation' || campaign.status === 'open') && isOwner(campaign)) {
                          return (
                            <View style={styles.creationButtonsContainer}>
                              <TouchableOpacity
                                style={styles.campaignButton}
                                onPress={() => handleSettingsPress(campaign.id)}
                              >
                                <Settings size={18} color="#fff" />
                                <Text style={styles.buttonText}>Campaign</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.inviteButton}
                                onPress={() => handleCampaignPress(campaign.id)}
                              >
                                <Users size={18} color="#fff" />
                                <Text style={styles.buttonText}>Invite</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                        
                        // Show continue button for other statuses
                        return (
                          <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => handleCampaignPress(campaign.id)}
                          >
                            {(campaign.status === 'creation' || campaign.status === 'open') ? (
                              <>
                                <Users size={20} color="#fff" />
                                <Text style={styles.buttonText}>Waiting for Start</Text>
                              </>
                            ) : (
                              <>
                                <Play size={20} color="#fff" />
                                <Text style={styles.buttonText}>Continue Story</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  ))}

                {campaigns.length === 0 && (
                  <>
                    <View style={styles.noCampaignsContainer}>
                      <Text style={styles.noCampaigns}>No active campaigns</Text>
                      <Text style={styles.noCampaignsSubtext}>
                        Create a new campaign or join an existing one!
                      </Text>
                    </View>
                    <View style={styles.campaignActionButtons}>
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateCampaign}
                      >
                        <Plus size={20} color="#fff" style={styles.gap} />
                        <Text style={styles.buttonText}>Create Campaign</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.campaignActionButtons}>
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleJoinCampaign}
                      >
                        <Users size={20} color="#fff" style={styles.gap}/>
                        <Text style={styles.buttonText}>Join a Campaign</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </ActivityIndicator>

      <TouchableOpacity 
        style={styles.boltLogo}
        onPress={handleBoltPress}
        activeOpacity={0.7}
      >
        <Image 
          source={require('../../assets/images/logotext_poweredby_360w.png')} 
          style={styles.boltLogoImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <SidebarMenu
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        onJoinCampaign={handleJoinCampaign}
      />

      <JoinCampaignModal
        isVisible={isJoinModalVisible}
        onClose={() => setIsJoinModalVisible(false)}
      />

      {/* Level Up Notification */}
      <CharacterLevelUpNotification
        isVisible={showLevelUpNotification}
        onClose={dismissLevelUpNotification}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    position: 'relative',
  },
  menuButton: {
    position: 'absolute',
    left: 20,
    top: 70,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  invitationsBanner: {
    backgroundColor: 'rgba(0, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff18',
  },
  invitationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  invitationsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  invitationCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
  },
  invitationCampaignName: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  invitationFrom: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 8,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptInvitationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
  },
  declineInvitationButton: {
    backgroundColor: '#ff4444',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
  },
  invitationButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  friendRequestsBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  friendRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  friendRequestsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  friendRequestCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
  },
  friendRequestUsername: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  friendRequestEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 8,
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptFriendRequestButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
  },
  declineFriendRequestButton: {
    backgroundColor: '#ff4444',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
  },
  friendRequestButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  campaignsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  charactersSection: {
    marginBottom: 20,
  },
  charactersContainer: {
    flex: 0.30,
    paddingBottom: 5,
    marginBottom: 5,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 0,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative', // Enable absolute positioning for notification dot
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1,
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
  campaignTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  campaignTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingRight: 24, // Add padding to prevent overlap with notification dot
  },
  characterAvatarWrapper: {
    position: 'relative',
  },
  campaignHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  retiredCampaignHeaderAvatar: {
    borderColor: '#666',
    opacity: 0.7,
  },
  campaignCharacterLevelUpBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  crownSpace: {
    width: 20,
    height: 12
  },
  creationButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  campaignButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  inviteButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
    paddingTop: 10,
    gap: 12,
    //flexDirection: 'row'
  },
  characterActionButton: {
    paddingTop: 10,
    gap: 12,
    marginBottom: 30,
    //flexDirection: 'row'
  },
  charactersGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e2e2',
    marginBottom: 24
  },
  characterCard: {
    padding: 12,
    width: 100,
  },
  characterAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 4,
  },
  characterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  retiredCharacterAvatar: {
    borderColor: '#666',
    opacity: 0.7,
  },
  characterLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: '#2a2a2a',
    minWidth: 28,
    justifyContent: 'center',
  },
  retiredCharacterLevelBadge: {
    backgroundColor: '#666',
  },
  levelUpBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  characterLevel: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  characterInfo: {
    alignItems: 'center',
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
    marginBottom: 4,
  },
  characterCampaign: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    textAlign: 'center',
  },
  noCharactersContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 12,
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
    marginTop: 6,
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
    marginBottom: 10,
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  campaignsScrollView: {
    flex: 1,
  },
  campaignsScrollContent: {
    paddingBottom: 50,
  },
  charactersScrollView: {
    flex: 1,
  },
  charactersScrollContent: {
    paddingHorizontal: 10,
  },
  logoImg: {
    width: 300,
    height: 70,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  ownerText: {
    color: '#FFD700',
  },
  playerText: {
    color: '#4CAF50',
  },
  gap: {
    marginRight: 10
  },
  boltLogo: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Low z-index so other interactive elements can be higher
    pointerEvents: 'box-none', // Allow touches to pass through to content behind
  },
  boltLogoImage: {
    width: '100%',
    height: '100%',
  },
});