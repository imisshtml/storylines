import { supabase } from '../config/supabase';

interface UserCampaign {
  id: string;
  players: any[];
  owner: string;
  players_online?: Record<string, string>;
}

interface CharacterInfo {
  id: string;
  name: string;
  campaign_id: string;
}

/**
 * Get all campaigns that a user is part of (either as owner or player)
 */
export const getUserCampaigns = async (userId: string): Promise<UserCampaign[]> => {
  try {
    // Get campaigns where user is the owner
    const { data: ownedCampaigns, error: ownedError } = await supabase
      .from('campaigns')
      .select('id, players, owner, players_online')
      .eq('owner', userId);

    if (ownedError) throw ownedError;

    // Get all campaigns and filter client-side for ones where user is a player
    const { data: allCampaigns, error: allError } = await supabase
      .from('campaigns')
      .select('id, players, owner, players_online');

    if (allError) throw allError;

    // Filter campaigns where user is a player (but not owner to avoid duplicates)
    const playerCampaigns = allCampaigns?.filter(campaign => {
      // Skip if user is already the owner (already included in ownedCampaigns)
      if (campaign.owner === userId) return false;

      // Check if user is in the players array
      const players = campaign.players || [];
      return players.some((player: any) => player.id === userId);
    }) || [];

    // Combine owned and player campaigns
    return [...(ownedCampaigns || []), ...playerCampaigns];
  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    return [];
  }
};

/**
 * Get character names for a user's campaigns
 */
export const getUserCharacterNames = async (userId: string, campaignIds: string[]): Promise<Record<string, string>> => {
  try {
    const { data: characters, error } = await supabase
      .from('characters')
      .select('id, name, campaign_id')
      .eq('user_id', userId)
      .in('campaign_id', campaignIds);

    if (error) throw error;

    // Create a map of campaign_id -> character_name
    const characterMap: Record<string, string> = {};
    characters?.forEach((char: CharacterInfo) => {
      if (char.campaign_id && char.name) {
        characterMap[char.campaign_id] = char.name;
      }
    });

    return characterMap;
  } catch (error) {
    console.error('Error fetching user characters:', error);
    return {};
  }
};

/**
 * Add a user to the online status of all their campaigns
 */
export const addUserToOnlineStatus = async (userId: string): Promise<void> => {
  try {
    console.log('🟢 Adding user to online status:', userId);
    
    // Get all campaigns the user is part of
    const campaigns = await getUserCampaigns(userId);
    console.log('Found campaigns for user:', campaigns.length);

    if (campaigns.length === 0) return;

    // Get character names for all campaigns
    const campaignIds = campaigns.map(c => c.id);
    const characterNames = await getUserCharacterNames(userId, campaignIds);

    // Update each campaign's players_online field
    const updatePromises = campaigns.map(async (campaign) => {
      const characterName = characterNames[campaign.id] || 'Unknown Character';
      const currentOnline = campaign.players_online || {};
      
      // Add this user to the online players
      const updatedOnline = {
        ...currentOnline,
        [userId]: characterName
      };

      console.log(`🔄 Updating campaign ${campaign.id}: Adding ${characterName} (${userId})`);

      const { error } = await supabase
        .from('campaigns')
        .update({ players_online: updatedOnline })
        .eq('id', campaign.id);

      if (error) {
        console.error(`Error updating online status for campaign ${campaign.id}:`, error);
      } else {
        console.log(`✅ Successfully added to campaign ${campaign.id}`);
      }
    });

    await Promise.all(updatePromises);
    console.log('🟢 User online status update completed');
  } catch (error) {
    console.error('Error adding user to online status:', error);
  }
};

/**
 * Remove a user from the online status of all their campaigns
 */
export const removeUserFromOnlineStatus = async (userId: string): Promise<void> => {
  try {
    console.log('🔴 Removing user from online status:', userId);
    
    // Get all campaigns the user is part of
    const campaigns = await getUserCampaigns(userId);
    console.log('Found campaigns for user:', campaigns.length);

    if (campaigns.length === 0) return;

    // Update each campaign's players_online field
    const updatePromises = campaigns.map(async (campaign) => {
      const currentOnline = campaign.players_online || {};
      
      // Remove this user from the online players
      const updatedOnline = { ...currentOnline };
      delete updatedOnline[userId];

      console.log(`🔄 Updating campaign ${campaign.id}: Removing user ${userId}`);

      const { error } = await supabase
        .from('campaigns')
        .update({ players_online: updatedOnline })
        .eq('id', campaign.id);

      if (error) {
        console.error(`Error updating online status for campaign ${campaign.id}:`, error);
      } else {
        console.log(`✅ Successfully removed from campaign ${campaign.id}`);
      }
    });

    await Promise.all(updatePromises);
    console.log('🔴 User offline status update completed');
  } catch (error) {
    console.error('Error removing user from online status:', error);
  }
};

/**
 * Update online status when user's character changes
 */
export const updateUserCharacterName = async (userId: string, campaignId: string, newCharacterName: string): Promise<void> => {
  try {
    console.log(`📝 Updating character name for user ${userId} in campaign ${campaignId}: ${newCharacterName}`);
    
    // Get the specific campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('players_online')
      .eq('id', campaignId)
      .single();

    if (fetchError) throw fetchError;

    const currentOnline = campaign?.players_online || {};
    
    // Update the character name if user is online
    if (currentOnline[userId]) {
      const updatedOnline = {
        ...currentOnline,
        [userId]: newCharacterName
      };

      const { error } = await supabase
        .from('campaigns')
        .update({ players_online: updatedOnline })
        .eq('id', campaignId);

      if (error) {
        console.error(`Error updating character name for campaign ${campaignId}:`, error);
      } else {
        console.log(`✅ Updated character name to ${newCharacterName}`);
      }
    }
  } catch (error) {
    console.error('Error updating character name:', error);
  }
}; 