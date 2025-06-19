import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Users,
  Crown,
  Check,
  X,
  Trash2,
  ChevronRight,
  UserCheck,
  Clock,
  UserX,
  Key,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { campaignsAtom } from '../atoms/campaignAtoms';
import {
  friendsAtom,
  friendRequestsReceivedAtom,
  friendRequestsSentAtom,
  campaignInvitationsAtom,
  userSearchResultsAtom,
  searchLoadingAtom,
  fetchFriendsAtom,
  fetchFriendRequestsReceivedAtom,
  fetchFriendRequestsSentAtom,
  fetchCampaignInvitationsAtom,
  searchUsersAtom,
  sendFriendRequestAtom,
  respondToFriendRequestAtom,
  removeFriendAtom,
  sendCampaignInvitationAtom,
  respondToCampaignInvitationAtom,
  type Friendship,
  type UserProfile,
} from '../atoms/friendsAtoms';
import { useCustomAlert } from '../components/CustomAlert';
import { supabase } from '../config/supabase';

type TabType = 'friends' | 'requests' | 'invitations' | 'search';

export default function FriendsScreen() {
  const [user] = useAtom(userAtom);
  const [campaigns] = useAtom(campaignsAtom);
  const [friends] = useAtom(friendsAtom);
  const [friendRequestsReceived] = useAtom(friendRequestsReceivedAtom);
  const [friendRequestsSent] = useAtom(friendRequestsSentAtom);
  const [campaignInvitations] = useAtom(campaignInvitationsAtom);
  const [searchResults] = useAtom(userSearchResultsAtom);
  const [searchLoading] = useAtom(searchLoadingAtom);

  const [, fetchFriends] = useAtom(fetchFriendsAtom);
  const [, fetchRequestsReceived] = useAtom(fetchFriendRequestsReceivedAtom);
  const [, fetchRequestsSent] = useAtom(fetchFriendRequestsSentAtom);
  const [, fetchInvitations] = useAtom(fetchCampaignInvitationsAtom);
  const [, searchUsers] = useAtom(searchUsersAtom);
  const [, sendFriendRequest] = useAtom(sendFriendRequestAtom);
  const [, respondToFriendRequest] = useAtom(respondToFriendRequestAtom);
  const [, removeFriend] = useAtom(removeFriendAtom);
  const [, sendCampaignInvitation] = useAtom(sendCampaignInvitationAtom);
  const [, respondToCampaignInvitation] = useAtom(respondToCampaignInvitationAtom);
  const [, setUserSearchResults] = useAtom(userSearchResultsAtom);

  const { showAlert } = useCustomAlert();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCampaignInviteModal, setShowCampaignInviteModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friendship | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const sentRef = useRef(false);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);

  // Fetch sent campaign invitations
  const fetchSentInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching sent invitations:', error);
        return;
      }

      setSentInvitations(data || []);
    } catch (error) {
      console.error('Error fetching sent invitations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchRequestsReceived();
      fetchRequestsSent();
      fetchInvitations();
      fetchSentInvitations();
    }
  }, [user, fetchFriends, fetchRequestsReceived, fetchRequestsSent, fetchInvitations]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleBack = () => {
    router.back();
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (sentRef.current) {
      console.log('[handleSendFriendRequest] blocked by sentRef');
      return;
    }
    sentRef.current = true;
    console.log('[handleSendFriendRequest] called with', targetUserId);
    try {
      setIsLoading(true);
      console.log('[handleSendFriendRequest] setIsLoading(true)');
      await sendFriendRequest(targetUserId);
      console.log('[handleSendFriendRequest] sendFriendRequest resolved');
      showAlert('Friend Request Sent', 'Your friend request has been sent successfully!', undefined, 'success');
      console.log('[handleSendFriendRequest] showAlert called (success)');
      setTimeout(() => {
        setSearchQuery('');
        setUserSearchResults([]);
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
        sentRef.current = false;
        console.log('[handleSendFriendRequest] setSearchQuery("") and blur input, sentRef reset');
      }, 1500);
    } catch (error) {
      showAlert('Error', 'Failed to send friend request. Please try again.', undefined, 'error');
      console.log('[handleSendFriendRequest] showAlert called (error)', error);
      sentRef.current = false;
    } finally {
      setIsLoading(false);
      console.log('[handleSendFriendRequest] setIsLoading(false)');
    }
  };

  const handleRespondToFriendRequest = async (friendshipId: string, response: 'accepted' | 'rejected') => {
    try {
      setIsLoading(true);
      await respondToFriendRequest({ friendshipId, response });
      showAlert(
        response === 'accepted' ? 'Friend Request Accepted' : 'Friend Request Rejected',
        `You have ${response} the friend request.`,
        undefined,
        'success'
      );
    } catch (error) {
      showAlert('Error', 'Failed to respond to friend request. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = (friendship: Friendship) => {
    showAlert(
      'Remove Friend',
      `Are you sure you want to remove ${friendship.friend_profile?.username} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await removeFriend(friendship.id);
              showAlert('Friend Removed', 'Friend has been removed from your list.', undefined, 'success');
            } catch (error) {
              showAlert('Error', 'Failed to remove friend. Please try again.', undefined, 'error');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleInviteToCampaign = (friend: Friendship) => {
    setSelectedFriend(friend);
    setShowCampaignInviteModal(true);
  };

  const handleSendCampaignInvite = async (campaignId: string) => {
    if (!selectedFriend) return;

    try {
      setIsLoading(true);
      await sendCampaignInvitation({
        campaignId,
        friendId: selectedFriend.friend_profile!.id,
      });
      showAlert(
        'Campaign Invitation Sent',
        `Invitation sent to ${selectedFriend.friend_profile?.username}!`,
        undefined,
        'success'
      );

      // Refresh sent invitations to update pending status
      fetchSentInvitations();

      setShowCampaignInviteModal(false);
      setSelectedFriend(null);
    } catch (error) {
      showAlert('Error', 'Failed to send campaign invitation. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToCampaignInvitation = async (invitationId: string, response: 'accepted' | 'rejected') => {
    try {
      setIsLoading(true);
      await respondToCampaignInvitation({ invitationId, response });

      if (response === 'accepted') {
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
      } else {
        showAlert('Campaign Invitation Rejected', 'You have declined the campaign invitation.', undefined, 'success');
      }
    } catch (error) {
      showAlert('Error', 'Failed to respond to campaign invitation. Please try again.', undefined, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSharedCampaigns = (friend: Friendship) => {
    if (!friend.friend_profile) return [];

    return campaigns.filter(campaign =>
      campaign.players.some((player: any) => player.id === friend.friend_profile!.id) &&
      campaign.players.some((player: any) => player.id === user?.id)
    );
  };

  // Check if a friend has a pending invitation to a specific campaign
  const hasPendingInvitation = (friendId: string, campaignId: string) => {
    return sentInvitations.some(invitation =>
      invitation.campaign_id === campaignId &&
      invitation.invitee_id === friendId &&
      invitation.status === 'pending'
    );
  };

  const getAvailableCampaigns = () => {
    if (!selectedFriend?.friend_profile) return [];

    return campaigns.filter(campaign => {
      // Must be owned by current user and in creation phase
      const isOwned = campaign.owner === user?.id && campaign.status === 'creation';

      // Friend must not already be in the campaign
      const isNotInCampaign = !campaign.players.some((player: any) =>
        player.id === selectedFriend.friend_profile!.id
      );

      return isOwned && isNotInCampaign;
    });
  };

  const renderTabButton = (tab: TabType, title: string, count?: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFriendsList = () => (
    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
          <Text style={styles.emptyStateText}>
            Search for friends or send friend requests to get started!
          </Text>
        </View>
      ) : (
        friends.map((friend) => {
          const sharedCampaigns = getSharedCampaigns(friend);
          return (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.friendHeader}>
                <View style={styles.friendInfo}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {friend.friend_profile?.username?.charAt(0).toUpperCase() || 'F'}
                    </Text>
                  </View>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friend.friend_profile?.username}</Text>
                    <Text style={styles.friendEmail}>{friend.friend_profile?.email}</Text>
                    {sharedCampaigns.length > 0 && (
                      <Text style={styles.sharedCampaigns}>
                        {sharedCampaigns.length} shared campaign{sharedCampaigns.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.friendActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleInviteToCampaign(friend)}
                  >
                    <Key size={16} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={() => handleRemoveFriend(friend)}
                  >
                    <Trash2 size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              {sharedCampaigns.length > 0 && (
                <View style={styles.sharedCampaignsList}>
                  {sharedCampaigns.map((campaign) => (
                    <View key={campaign.id} style={styles.sharedCampaignItem}>
                      <Crown size={14} color="#FFD700" />
                      <Text style={styles.sharedCampaignName}>{campaign.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderFriendRequests = () => (
    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
      {/* Received Requests */}
      {friendRequestsReceived.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{'Received Requests'}</Text>
          {friendRequestsReceived.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.friendInfo}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {request.friend_profile?.username?.charAt(0).toUpperCase() || 'F'}
                  </Text>
                </View>
                <View style={styles.friendDetails}>
                  <Text style={styles.friendName}>{request.friend_profile?.username}</Text>
                  <Text style={styles.friendEmail}>{request.friend_profile?.email}</Text>
                  <Text style={styles.requestDate}>
                    {new Date(request.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleRespondToFriendRequest(request.id, 'accepted')}
                >
                  <Check size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRespondToFriendRequest(request.id, 'rejected')}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Sent Requests */}
      {friendRequestsSent.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{'Sent Requests'}</Text>
          {friendRequestsSent.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.friendInfo}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {request.friend_profile?.username?.charAt(0).toUpperCase() || 'F'}
                  </Text>
                </View>
                <View style={styles.friendDetails}>
                  <Text style={styles.friendName}>{request.friend_profile?.username}</Text>
                  <Text style={styles.friendEmail}>{request.friend_profile?.email}</Text>
                  <Text style={styles.requestDate}>
                    Sent {new Date(request.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.pendingIndicator}>
                <Clock size={16} color="#FFA726" />
                <Text style={styles.pendingText}>{'Pending'}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {friendRequestsReceived.length === 0 && friendRequestsSent.length === 0 && (
        <View style={styles.emptyState}>
          <UserCheck size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>{'No Friend Requests'}</Text>
          <Text style={styles.emptyStateText}>
            {"You don't have any pending friend requests."}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderCampaignInvitations = () => (
    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
      {campaignInvitations.length === 0 ? (
        <View style={styles.emptyState}>
          <Crown size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>{'No Campaign Invitations'}</Text>
          <Text style={styles.emptyStateText}>
            {"You don't have any pending campaign invitations."}
          </Text>
        </View>
      ) : (
        campaignInvitations.map((invitation) => (
          <View key={invitation.id} style={styles.invitationCard}>
            <View style={styles.invitationHeader}>
              <Crown size={20} color="#FFD700" />
              <Text style={styles.invitationTitle}>{invitation.campaign?.name}</Text>
            </View>
            <Text style={styles.invitationAdventure}>{invitation.campaign?.adventure}</Text>
            <Text style={styles.invitationFrom}>
              Invited by {invitation.inviter_profile?.username}
            </Text>
            <Text style={styles.invitationDate}>
              {new Date(invitation.created_at).toLocaleDateString()}
            </Text>
            <View style={styles.invitationActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleRespondToCampaignInvitation(invitation.id, 'accepted')}
              >
                <Check size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRespondToCampaignInvitation(invitation.id, 'rejected')}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color="#666" />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by username or exact email..."
          placeholderTextColor="#666"
        />
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length === 0 && searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <UserX size={48} color="#666" />
            <Text style={styles.emptyStateTitle}>No Users Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.includes('@') 
                ? 'No exact match found for this email address.' 
                : 'Try searching with a different username.'}
            </Text>
          </View>
        ) : (
          searchResults.map((userProfile) => (
            <View key={userProfile.id} style={styles.searchResultCard}>
              <View style={styles.friendInfo}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.friendDetails}>
                  {userProfile.searchMatchType === 'username' ? (
                    <Text style={styles.friendName}>{userProfile.username}</Text>
                  ) : (
                    <Text style={styles.friendEmail}>{userProfile.email}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => handleSendFriendRequest(userProfile.id)}
                disabled={isLoading}
              >
                <UserPlus size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('friends', 'Friends', friends.length)}
        {renderTabButton('requests', 'Requests', friendRequestsReceived.length + friendRequestsSent.length)}
        {renderTabButton('invitations', 'Invitations', campaignInvitations.length)}
        {renderTabButton('search', 'Search')}
      </View>

      <View style={styles.content}>
        {activeTab === 'friends' && renderFriendsList()}
        {activeTab === 'requests' && renderFriendRequests()}
        {activeTab === 'invitations' && renderCampaignInvitations()}
        {activeTab === 'search' && renderSearch()}
      </View>

      {/* Campaign Invite Modal */}
      <Modal
        visible={showCampaignInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCampaignInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Invite {selectedFriend?.friend_profile?.username} to Campaign
              </Text>
              <TouchableOpacity onPress={() => setShowCampaignInviteModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {getAvailableCampaigns().length === 0 ? (
                <View style={styles.emptyState}>
                  <Crown size={48} color="#666" />
                  <Text style={styles.emptyStateTitle}>{'No Available Campaigns'}</Text>
                  <Text style={styles.emptyStateText}>
                    {"You don't have any campaigns in creation phase to invite friends to."}
                  </Text>
                </View>
              ) : (
                getAvailableCampaigns().map((campaign) => {
                  const isPending = selectedFriend?.friend_profile ?
                    hasPendingInvitation(selectedFriend.friend_profile.id, campaign.uid) :
                    false;

                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      onPress={isPending ? undefined : () => handleSendCampaignInvite(campaign.uid)}
                      style={[
                        styles.campaignOption,
                        isPending && styles.campaignOptionDisabled
                      ]}
                      disabled={isPending}
                    >
                      <View style={styles.campaignInfo}>
                        <Text style={styles.campaignName}>{campaign.name}</Text>
                        <Text style={styles.campaignAdventure}>{campaign.adventure}</Text>
                      </View>
                      {isPending ? (
                        <View style={styles.pendingIndicator}>
                          <Clock size={16} color="#FFA726" />
                          <Text style={styles.pendingText}>{'Pending'}</Text>
                        </View>
                      ) : (
                        <ChevronRight size={20} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
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
    marginRight: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
  },
  activeTabButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  friendCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 2,
  },
  sharedCampaigns: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dangerButton: {
    backgroundColor: '#aa3333',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#aa3333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  sharedCampaignsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  sharedCampaignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sharedCampaignName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFA726',
  },
  invitationCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  invitationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  invitationAdventure: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 8,
  },
  invitationFrom: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 12,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchResultCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  campaignOption: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignOptionDisabled: {
    backgroundColor: '#1a1a1a',
    opacity: 0.6,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  campaignAdventure: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    marginLeft: 4,
  },
});