import { atom } from 'jotai';
import { supabase } from '../config/supabase';

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
      if (!user) return;

      const { data: requests, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, email)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const transformedRequests = (requests || []).map(request => ({
        ...request,
        friend_profile: request.requester
      }));

      set(friendRequestsReceivedAtom, transformedRequests);
    } catch (error) {
      console.error('Error fetching friend requests received:', error);
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

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .neq('id', user.id) // Exclude current user
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      set(userSearchResultsAtom, users || []);
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
      const { fetchFriendRequestsSentAtom } = await import('./friendsAtoms');
      set(fetchFriendRequestsSentAtom, null);
    } catch (error) {
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
      const { fetchFriendsAtom, fetchFriendRequestsReceivedAtom } = await import('./friendsAtoms');
      set(fetchFriendsAtom, null);
      set(fetchFriendRequestsReceivedAtom, null);
    } catch (error) {
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
      set(fetchFriendsAtom, null);
    } catch (error) {
      throw error;
    }
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
          .select(`
            campaign_id,
            campaign:campaigns(*)
          `)
          .eq('id', invitationId)
          .single();

        if (invitationError) throw invitationError;

        if (invitation?.campaign) {
          // Add user to campaign players
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const currentPlayers = invitation.campaign.players || [];
          const newPlayer = {
            id: user.id,
            name: user.username || user.email || 'Player',
            ready: false,
          };

          const updatedPlayers = [...currentPlayers, newPlayer];

          const { error: campaignError } = await supabase
            .from('campaigns')
            .update({ players: updatedPlayers })
            .eq('id', invitation.campaign_id);

          if (campaignError) throw campaignError;
        }
      }

      // Refresh campaign invitations
      const { fetchCampaignInvitationsAtom } = await import('./friendsAtoms');
      set(fetchCampaignInvitationsAtom, null);
    } catch (error) {
      throw error;
    }
  }
);