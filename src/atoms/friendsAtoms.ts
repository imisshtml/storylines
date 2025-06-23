import { atom } from 'jotai';
import { supabase } from '../config/supabase';
import { currentCampaignAtom } from './campaignAtoms';
import { Platform } from 'react-native';

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
  friend_profile?: {
    id: string;
    username: string;
    email: string;
  };
};

export type CampaignInvitation = {
  id: string;
  campaign_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  campaign?: {
    id: string;
    name: string;
    adventure: string;
  };
  inviter_profile?: {
    id: string;
    username: string;
    email: string;
  };
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  searchMatchType?: 'username' | 'email';
};

// Friends state
export const friendsAtom = atom<Friendship[]>([]);
export const friendRequestsReceivedAtom = atom<Friendship[]>([]);
export const friendRequestsSentAtom = atom<Friendship[]>([]);
export const campaignInvitationsAtom = atom<CampaignInvitation[]>([]);
export const friendsLoadingAtom = atom(false);
export const friendsErrorAtom = atom<string | null>(null);

// Search results
export const userSearchResultsAtom = atom<UserProfile[]>([]);
export const searchLoadingAtom = atom(false);

// Fetch friends
export const fetchFriendsAtom = atom(
  null,
  async (get, set) => {
    try {
      set(friendsLoadingAtom, true);
      set(friendsErrorAtom, null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, email),
          addressee:profiles!friendships_addressee_id_fkey(id, username, email)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Transform data to include friend profile
      const transformedFriends = (friendships || []).map(friendship => ({
        ...friendship,
        friend_profile: friendship.requester_id === user.id
          ? friendship.addressee
          : friendship.requester
      }));

      set(friendsAtom, transformedFriends);
    } catch (error) {
      set(friendsErrorAtom, (error as Error).message);
      console.error('Error fetching friends:', error);
    } finally {
      set(friendsLoadingAtom, false);
    }
  }
);

// Fetch friend requests received
export const fetchFriendRequestsReceivedAtom = atom(
  null,
  async (get, set) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log(`[${Platform.OS}] [fetchFriendRequestsReceived] No user found`);
        return;
      }

      console.log(`[${Platform.OS}] [fetchFriendRequestsReceived] Fetching friend requests for user:`, user.id);

      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, email)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error(`[${Platform.OS}] [fetchFriendRequestsReceived] Error:`, error);
        throw error;
      }

      console.log(`[${Platform.OS}] [fetchFriendRequestsReceived] Raw requests data:`, requests);

      const transformedRequests = (requests || []).map(request => ({
        ...request,
        friend_profile: request.requester
      }));

      set(friendRequestsReceivedAtom, transformedRequests);
    } catch (error) {
      console.error(`[${Platform.OS}] [fetchFriendRequestsReceived] Error fetching friend requests received:`, error);
    }
  }
);

// Fetch friend requests sent
export const fetchFriendRequestsSentAtom = atom(
  null,
  async (get, set) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(id, username, email)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const transformedRequests = (requests || []).map(request => ({
        ...request,
        friend_profile: request.addressee
      }));

      set(friendRequestsSentAtom, transformedRequests);
    } catch (error) {
      console.error('Error fetching friend requests sent:', error);
    }
  }
);

// Fetch campaign invitations
export const fetchCampaignInvitationsAtom = atom(
  null,
  async (get, set) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invitations, error } = await supabase
        .from('campaign_invitations')
        .select(`
          *,
          campaign:campaigns(id, name, adventure),
          inviter:profiles!campaign_invitations_inviter_id_fkey(id, username, email)
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const transformedInvitations = (invitations || []).map(invitation => ({
        ...invitation,
        inviter_profile: invitation.inviter
      }));

      set(campaignInvitationsAtom, transformedInvitations);
    } catch (error) {
      console.error('Error fetching campaign invitations:', error);
    }
  }
);

// Search users
export const searchUsersAtom = atom(
  null,
  async (get, set, query: string) => {
    if (!query.trim()) {
      set(userSearchResultsAtom, []);
      return;
    }

    try {
      set(searchLoadingAtom, true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if query is an exact email address
      const isExactEmail = query.includes('@');

      let users: UserProfile[] = [];

      if (isExactEmail) {
        // Exact email match search
        const { data: emailUsers, error: emailError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .neq('id', user.id) // Exclude current user
          .ilike('email', query.toLowerCase());

        if (emailError) {
          console.error('Email search error:', emailError);
          throw emailError;
        }

        // Mark these results as email matches
        users = (emailUsers || []).map(user => ({
          ...user,
          searchMatchType: 'email' as const
        }));
      } else {
        // Username fuzzy search
        const searchPattern = `%${query}%`;
        const { data: usernameUsers, error: usernameError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .neq('id', user.id) // Exclude current user
          .ilike('username', searchPattern);

        if (usernameError) {
          console.error('Username search error:', usernameError);
          throw usernameError;
        }

        // Mark these results as username matches
        users = (usernameUsers || []).map(user => ({
          ...user,
          searchMatchType: 'username' as const
        }));
      }

      console.log('Search results:', users); // Debug log
      set(userSearchResultsAtom, users);
    } catch (error) {
      console.error('Error searching users:', error);
      set(userSearchResultsAtom, []);
    } finally {
      set(searchLoadingAtom, false);
    }
  }
);

// Send friend request
export const sendFriendRequestAtom = atom(
  null,
  async (get, set, targetUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending'
        });
      if (error) throw error;

      // Refresh friend requests sent
      set(fetchFriendRequestsSentAtom);
    } catch (error) {
      console.error(`[${Platform.OS}] [sendFriendRequestAtom] error:`, error);
      throw error;
    }
  }
);

// Respond to friend request
export const respondToFriendRequestAtom = atom(
  null,
  async (get, set, { friendshipId, response }: { friendshipId: string; response: 'accepted' | 'rejected' }) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: response })
        .eq('id', friendshipId);
      if (error) throw error;

      // Refresh all friend data
      set(fetchFriendsAtom);
      set(fetchFriendRequestsReceivedAtom);
    } catch (error) {
      console.error(`[${Platform.OS}] [respondToFriendRequestAtom] error:`, error);
      throw error;
    }
  }
);

// Remove friend
export const removeFriendAtom = atom(
  null,
  async (get, set, friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      // Refresh friends list
      const { fetchFriendsAtom } = await import('./friendsAtoms');
      set(fetchFriendsAtom);
    } catch (error) {
      throw error;
    }
  }
);

// Track the active subscription
let activeSubscription: any = null;
let activeUserId: string | null = null;

// Initialize real-time subscription for friendships
export const initializeFriendshipsRealtimeAtom = atom(
  null,
  async (get, set) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    // If we already have an active subscription for this user, return the existing cleanup
    if (activeSubscription && activeUserId === user.id) {
      return () => {
        if (activeSubscription) {
          activeSubscription.unsubscribe();
          activeSubscription = null;
          activeUserId = null;
        }
      };
    }

    // Clean up any existing subscription for a different user
    if (activeSubscription) {
      activeSubscription.unsubscribe();
      activeSubscription = null;
      activeUserId = null;
    }

    const subscription = supabase
      .channel(`friendships:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch all friend data to ensure consistency
          setTimeout(() => {
            set(fetchFriendsAtom);
            set(fetchFriendRequestsReceivedAtom);
            set(fetchFriendRequestsSentAtom);
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch all friend data to ensure consistency
          setTimeout(() => {
            set(fetchFriendsAtom);
            set(fetchFriendRequestsReceivedAtom);
            set(fetchFriendRequestsSentAtom);
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_invitations',
          filter: `inviter_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch campaign invitations
          setTimeout(() => {
            set(fetchCampaignInvitationsAtom);
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_invitations',
          filter: `invitee_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch campaign invitations
          setTimeout(() => {
            set(fetchCampaignInvitationsAtom);
          }, 100);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[${Platform.OS}] [Friendships Realtime] Subscription error occurred`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[${Platform.OS}] [Friendships Realtime] Subscription timed out`);
        }
      });

    // Store the subscription and user ID
    activeSubscription = subscription;
    activeUserId = user.id;

    return () => {
      if (activeSubscription) {
        activeSubscription.unsubscribe();
        activeSubscription = null;
        activeUserId = null;
      }
    };
  }
);

// Send campaign invitation
export const sendCampaignInvitationAtom = atom(
  null,
  async (get, set, { campaignId, friendId }: { campaignId: string; friendId: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('campaign_invitations')
        .insert({
          campaign_id: campaignId,
          inviter_id: user.id,
          invitee_id: friendId
        });
      if (error) throw error;
    } catch (error) {
      console.error('[sendCampaignInvitationAtom] error:', error);
      throw error;
    }
  }
);

// Respond to campaign invitation
export const respondToCampaignInvitationAtom = atom(
  null,
  async (get, set, { invitationId, response }: { invitationId: string; response: 'accepted' | 'rejected' }) => {
    try {
      const { error } = await supabase
        .from('campaign_invitations')
        .update({ status: response })
        .eq('id', invitationId);
      if (error) throw error;

      if (response === 'accepted') {
        // Get the campaign invitation details
        const { data: invitation, error: invitationError } = await supabase
          .from('campaign_invitations')
          .select(`campaign_id, campaign:campaigns(*)`)
          .eq('id', invitationId)
          .single();
        if (invitationError) throw invitationError;

        if (invitation?.campaign) {
          // Add user to campaign players (if not already present)
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const currentPlayers = invitation.campaign.players || [];
          const alreadyIn = currentPlayers.some((p: any) => p.id === user.id);
          let updatedPlayers = currentPlayers;
          if (!alreadyIn) {
            const newPlayer = {
              id: user.id,
              name: user.user_metadata?.username || user.email || 'Player',
              ready: false,
            };
            updatedPlayers = [...currentPlayers, newPlayer];
            const { error: campaignError } = await supabase
              .from('campaigns')
              .update({ players: updatedPlayers })
              .eq('id', invitation.campaign.id);
            if (campaignError) throw campaignError;
          }
          // Set current campaign in atom (for /invite screen)
          set(currentCampaignAtom, { ...invitation.campaign, players: updatedPlayers });
        }
      }

      // Refresh campaign invitations
      set(fetchCampaignInvitationsAtom);
    } catch (error) {
      console.error('[respondToCampaignInvitationAtom] error:', error);
      throw error;
    }
  }
);