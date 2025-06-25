import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Key, 
  Crown, 
  ChevronRight, 
  Info,
  UserPlus,
  Clock,
  X
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { supabase } from '../config/supabase';
import { userAtom } from '../atoms/authAtoms';
import { fetchCampaignsAtom, currentCampaignAtom } from '../atoms/campaignAtoms';
import { useCustomAlert } from '../components/CustomAlert';
import { ADVENTURES } from '../components/AdventureSelectSheet';
import { getCharacterAvatarUrl } from '../utils/avatarStorage';
import { charactersAtom, Character } from '../atoms/characterAtoms';

type Campaign = {
  id: string;
  uid: string;
  name: string;
  adventure: string;
  level: number;
  tone: 'serious' | 'humorous' | 'grimdark';
  exclude: string[];
  owner: string;
  status: 'creation' | 'waiting' | 'in_progress' | 'open';
  players: any[];
  invite_code: string;
  limit: number;
  content_level: 'kids' | 'teens' | 'adults';
  rp_focus: 'heavy_rp' | 'rp_focused' | 'balanced' | 'combat_focused' | 'heavy_combat';
  priority?: boolean;
  created_at: string;
  owner_profile?: {
    username: string;
    email: string;
  };
};

export default function JoinScreen() {
  const [user] = useAtom(userAtom);
  const [, fetchCampaigns] = useAtom(fetchCampaignsAtom);
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);
  const [characters] = useAtom(charactersAtom);
  const [campaignCharacters, setCampaignCharacters] = useState<Character[]>([]);
  
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCampaigns, setOpenCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  
  const { showAlert } = useCustomAlert();

  const fetchCampaignCharacters = useCallback(async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error fetching campaign characters:', error);
        return;
      }

      setCampaignCharacters(data || []);
    } catch (error) {
      console.error('Error fetching campaign characters:', error);
    }
  }, []);

  const getPlayerCharacter = useCallback((playerId: string, campaign: Campaign): Character | null => {
    // First, check if character info is stored in the campaign's players array
    const player = campaign.players.find(p => p.id === playerId);
    const playerWithCharacter = player as any;
    if (playerWithCharacter && playerWithCharacter.character) {
      // Convert the stored character info back to a Character object
      const charData = playerWithCharacter.character;
      return {
        id: charData.id,
        name: charData.name,
        class: charData.class,
        race: charData.race,
        level: charData.level,
        user_id: playerId,
        campaign_id: campaign.id,
        // Add default values for other required Character fields
        background: '',
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        skills: [],
        spells: [],
        equipment: [],
        current_hitpoints: 0,
        max_hitpoints: 0,
        temp_hitpoints: 0,
        armor_class: 10,
        conditions: [],
        gold: 0,
        silver: 0,
        copper: 0,
        avatar: charData.avatar || '',
        traits: [],
        features: [],
        saving_throws: [],
        proficiency: [],
        created_at: '',
        updated_at: '',
      } as Character;
    }

    // Fall back to database query
    const character = campaignCharacters.find(char => char.user_id === playerId);
    return character || null;
  }, [campaignCharacters]);

  useEffect(() => {
    fetchOpenCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignCharacters(selectedCampaign.id);
    }
  }, [selectedCampaign, fetchCampaignCharacters]);

  const fetchOpenCampaigns = async () => {
    if (!user) return;
    
    setIsLoadingCampaigns(true);
    try {
      // Fetch campaigns with status 'open'
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'open');
      
      if (error) {
        console.error('Error fetching open campaigns:', error);
        throw error;
      }

      // Fetch owner profiles separately
      const ownerIds = campaigns?.map(c => c.owner) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', ownerIds);

      if (profilesError) {
        console.error('Error fetching owner profiles:', profilesError);
        // Continue without profiles rather than failing completely
      }

      // Map profiles to campaigns
      const profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const campaignsWithProfiles = campaigns?.map(campaign => ({
        ...campaign,
        owner_profile: profileMap[campaign.owner]
      })) || [];
      
      // Filter out campaigns where the user is already a player
      const filteredCampaigns = campaignsWithProfiles.filter(campaign => {
        // Skip if user is the owner
        if (campaign.owner === user.id) return false;
        
        // Skip if user is already a player
        const isPlayer = campaign.players.some((player: any) => player.id === user.id);
        if (isPlayer) return false;
        
        // Skip if campaign is at player limit
        if (campaign.players.length >= (campaign.limit || 3)) return false;
        
        return true;
      });
      
      // Sort campaigns: priority first, then by created_at
      const sortedCampaigns = filteredCampaigns.sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setOpenCampaigns(sortedCampaigns);
    } catch (error) {
      console.error('Error fetching open campaigns:', error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const validateCode = (code: string): boolean => {
    // Must be exactly 6 characters and alphanumeric
    const codeRegex = /^[A-Za-z0-9]{6}$/;
    return codeRegex.test(code);
  };

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    const upperText = text.toUpperCase().slice(0, 6);
    setInviteCode(upperText);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleJoinCampaign = async () => {
    if (!validateCode(inviteCode)) {
      setError('Please enter a valid 6-character code');
      return;
    }

    if (!user) {
      setError('You must be logged in to join a campaign');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Attempting to join campaign with code:', inviteCode);

      // Query campaign by invite code
      const { data: campaign, error: queryError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (queryError) {
        console.error('Campaign query error:', queryError);
        setError(`Database error: ${queryError.message}`);
        return;
      }

      if (!campaign) {
        setError('Campaign not found. Please check the invite code.');
        return;
      }

      console.log('Found campaign:', campaign);

      // Check if user is already in the campaign
      const currentPlayers = campaign.players || [];
      const isAlreadyMember = currentPlayers.some((player: any) => player.id === user.id);

      if (isAlreadyMember) {
        setError('You are already a member of this campaign');
        return;
      }

      // Add user to campaign players
      const newPlayer = {
        id: user.id,
        name: user.username || user.email || 'Player',
        ready: false,
      };

      const updatedPlayers = [...currentPlayers, newPlayer];

      // Update campaign with new player
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ players: updatedPlayers })
        .eq('id', campaign.id);

      if (updateError) {
        console.error('Campaign update error:', updateError);
        setError(`Failed to join campaign: ${updateError.message}`);
        return;
      }

      console.log('Successfully joined campaign');

      // Set the current campaign so the invite screen knows which campaign to show
      setCurrentCampaign({
        ...campaign,
        players: updatedPlayers,
      });

      // Refresh campaigns list
      await fetchCampaigns();

      // Show success message
      showAlert(
        'Campaign Joined!',
        'You have successfully joined the campaign.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to invite friends screen
              router.push('/invite');
            }
          }
        ],
        'success'
      );

      setInviteCode('');

    } catch (err) {
      console.error('Join campaign exception:', err);
      setError(`Failed to join campaign: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignPress = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignModal(true);
  };

  const handleJoinOpenCampaign = async (campaign: Campaign) => {
    if (!user) {
      showAlert('Authentication Required', 'You must be logged in to join a campaign.', undefined, 'error');
      return;
    }

    try {
      setIsLoading(true);

      // Check if campaign is at player limit
      if (campaign.players.length >= (campaign.limit || 3)) {
        throw new Error('This campaign is already full.');
      }

      // Add user to campaign players
      const newPlayer = {
        id: user.id,
        name: user.username || user.email || 'Player',
        ready: false,
      };

      const updatedPlayers = [...campaign.players, newPlayer];

      // Update campaign with new player
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ players: updatedPlayers })
        .eq('id', campaign.id);

      if (updateError) {
        throw updateError;
      }

      // Set the current campaign
      setCurrentCampaign({
        ...campaign,
        players: updatedPlayers,
      });

      // Refresh campaigns list
      await fetchCampaigns();

      // Close modal
      setShowCampaignModal(false);

      // Show success message
      showAlert(
        'Campaign Joined!',
        'You have successfully joined the campaign.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to invite friends screen
              router.push('/invite');
            }
          }
        ],
        'success'
      );
    } catch (error) {
      console.error('Error joining open campaign:', error);
      showAlert(
        'Failed to Join',
        error instanceof Error ? error.message : 'An error occurred while joining the campaign.',
        undefined,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAdventureTitle = (adventureId: string): string => {
    const adventure = ADVENTURES.find(adv => adv.id === adventureId);
    return adventure ? adventure.title : adventureId;
  };

  const getContentLevelDisplay = (level: string): string => {
    const levels: Record<string, string> = {
      'kids': 'Kids Friendly',
      'teens': 'Teen Appropriate',
      'adults': 'Mature Content'
    };
    return levels[level] || level;
  };

  const getRpFocusDisplay = (focus: string): string => {
    const focuses: Record<string, string> = {
      'heavy_rp': 'Heavy Roleplay',
      'rp_focused': 'Roleplay Focused',
      'balanced': 'Balanced',
      'combat_focused': 'Combat Focused',
      'heavy_combat': 'Heavy Combat'
    };
    return focuses[focus] || focus;
  };

  const filteredCampaigns = openCampaigns.filter(campaign => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(query) ||
      getAdventureTitle(campaign.adventure).toLowerCase().includes(query) ||
      campaign.owner_profile?.username?.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Join a Campaign</Text>
      </View>

      <View style={styles.content}>
        {/* Join by Code Section */}
        <View style={styles.joinByCodeContainer}>
          <View style={styles.sectionHeader}>
            <Key size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Join by Invite Code</Text>
          </View>
          
          <View style={styles.codeInputContainer}>
            <TextInput
              style={[
                styles.codeInput,
                error && styles.codeInputError,
                inviteCode.length === 6 && validateCode(inviteCode) && styles.codeInputValid
              ]}
              value={inviteCode}
              onChangeText={handleCodeChange}
              placeholder="Enter code"
              placeholderTextColor="#666"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
            
            <TouchableOpacity
              style={[
                styles.joinButton,
                (!validateCode(inviteCode) || isLoading) && styles.joinButtonDisabled
              ]}
              onPress={handleJoinCampaign}
              disabled={!validateCode(inviteCode) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <UserPlus size={16} color="#fff" />
                  <Text style={styles.joinButtonText}>Join</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Open Campaigns Section */}
        <View style={styles.openCampaignsContainer}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Open Campaigns</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search campaigns..."
              placeholderTextColor="#666"
            />
          </View>
          
          {isLoadingCampaigns ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading campaigns...</Text>
            </View>
          ) : filteredCampaigns.length === 0 ? (
            <View style={styles.emptyCampaignsContainer}>
              <Crown size={48} color="#666" />
              <Text style={styles.emptyCampaignsTitle}>No Open Campaigns</Text>
              <Text style={styles.emptyCampaignsText}>
                There are no open campaigns available to join at the moment.
                Try using an invite code or check back later.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.campaignsList} showsVerticalScrollIndicator={false}>
              {filteredCampaigns.map((campaign) => (
                <TouchableOpacity
                  key={campaign.id}
                  style={[
                    styles.campaignCard,
                    campaign.priority && styles.priorityCampaignCard
                  ]}
                  onPress={() => handleCampaignPress(campaign)}
                >
                  {campaign.priority && (
                    <View style={styles.priorityBadge}>
                      <Crown size={12} color="#fff" />
                      <Text style={styles.priorityText}>FEATURED</Text>
                    </View>
                  )}
                  
                  <View style={styles.campaignHeader}>
                    <Text style={styles.campaignName}>{campaign.name}</Text>
                    <ChevronRight size={20} color="#4CAF50" />
                  </View>
                  
                  <Text style={styles.campaignAdventure}>
                    {getAdventureTitle(campaign.adventure)}
                  </Text>
                  
                  <View style={styles.campaignDetails}>
                    <View style={styles.campaignDetail}>
                      <Text style={styles.detailLabel}>Host:</Text>
                      <Text style={styles.detailValue}>
                        {campaign.owner_profile?.username || 'Unknown'}
                      </Text>
                    </View>
                    
                    <View style={styles.campaignDetail}>
                      <Text style={styles.detailLabel}>Players:</Text>
                      <Text style={styles.detailValue}>
                        {campaign.players.length}/{campaign.limit || 3}
                      </Text>
                    </View>
                    
                    <View style={styles.campaignDetail}>
                      <Text style={styles.detailLabel}>Content:</Text>
                      <Text style={styles.detailValue}>
                        {getContentLevelDisplay(campaign.content_level)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Campaign Details Modal */}
      <Modal
        visible={showCampaignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCampaignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Campaign Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCampaignModal(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedCampaign && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalCampaignName}>{selectedCampaign.name}</Text>
                
                <View style={styles.adventureCard}>
                  <Text style={styles.adventureTitle}>
                    {getAdventureTitle(selectedCampaign.adventure)}
                  </Text>
                  <Text style={styles.adventureDescription}>
                    {ADVENTURES.find(adv => adv.id === selectedCampaign.adventure)?.description || 'No description available.'}
                  </Text>
                </View>
                
                {/* Players Section */}
                <View style={styles.playersCard}>
                  <View style={styles.playersHeader}>
                    <Users size={20} color="#4CAF50" />
                    <Text style={styles.playersTitle}>
                      Players ({selectedCampaign.players.length}/{selectedCampaign.limit || 3})
                    </Text>
                  </View>
                  <View style={styles.playersList}>
                    {selectedCampaign.players.map((player, index) => {
                      const playerCharacter = getPlayerCharacter(player.id, selectedCampaign);
                      const isOwner = player.id === selectedCampaign.owner;
                      
                      return (
                        <View key={player.id} style={styles.playerItem}>
                          <View style={styles.playerInfo}>
                            {isOwner ? (
                              <Crown size={16} color="#FFD700" />
                            ) : (
                              <Users size={16} color="#4CAF50" />
                            )}
                            <Text style={styles.playerName}>
                              {player.name || `Player ${index + 1}`}
                            </Text>
                          </View>
                          
                          <View style={styles.characterInfo}>
                            {playerCharacter ? (
                              <View style={styles.playerCharacterContainer}>
                                <Image
                                  source={getCharacterAvatarUrl(playerCharacter)}
                                  style={styles.playerCharacterAvatar}
                                />
                                <View style={styles.playerCharacterDetails}>
                                  <Text style={styles.playerCharacterName}>
                                    {playerCharacter.name}
                                  </Text>
                                  <Text style={styles.playerCharacterClass}>
                                    Lv{playerCharacter.level} {playerCharacter.race} {playerCharacter.class}
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <Text style={styles.noCharacterText}>No Character</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Players</Text>
                    <Text style={styles.detailItemValue}>
                      {selectedCampaign.players.length}/{selectedCampaign.limit || 3}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Content Level</Text>
                    <Text style={styles.detailItemValue}>
                      {getContentLevelDisplay(selectedCampaign.content_level)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Tone</Text>
                    <Text style={styles.detailItemValue}>
                      {selectedCampaign.tone.charAt(0).toUpperCase() + selectedCampaign.tone.slice(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Focus</Text>
                    <Text style={styles.detailItemValue}>
                      {getRpFocusDisplay(selectedCampaign.rp_focus)}
                    </Text>
                  </View>
                </View>
                
                {/* Excluded Content Section */}
                {selectedCampaign?.exclude && selectedCampaign?.exclude.length > 0 && (() => {
                  // Flatten the exclude array in case it's nested
                  const flattenedExclude = selectedCampaign?.exclude?.flat() || [];
                  return flattenedExclude.length > 0 ? (
                    <View style={styles.excludedContentCard}>
                      <Text style={styles.excludedContentTitle}>Excluded Content</Text>
                      <View style={styles.excludedContentList}>
                        {flattenedExclude.map((item, index) => (
                          <View key={index} style={styles.excludedContentItem}>
                            <Text style={styles.excludedContentText}>• {item}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.excludedContentNote}>
                        This content will not appear in the campaign
                      </Text>
                    </View>
                  ) : null;
                })()}
                
                <TouchableOpacity
                  style={[
                    styles.joinCampaignButton,
                    isLoading && styles.joinCampaignButtonDisabled
                  ]}
                  onPress={() => handleJoinOpenCampaign(selectedCampaign)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <UserPlus size={20} color="#fff" />
                      <Text style={styles.joinCampaignButtonText}>Join Campaign</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <View style={styles.campaignInfoNote}>
                  <Info size={16} color="#888" />
                  <Text style={styles.campaignInfoNoteText}>
                    Joining this campaign will allow you to create or select a character and participate in the adventure.
                  </Text>
                </View>
              </ScrollView>
            )}
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
    marginRight: 40, // Compensate for back button
  },
  content: {
    flex: 1,
    padding: 16,
  },
  joinByCodeContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeInputError: {
    borderColor: '#f44336',
  },
  codeInputValid: {
    borderColor: '#4CAF50',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#666',
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#f44336',
    lineHeight: 20,
  },
  openCampaignsContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 16,
  },
  emptyCampaignsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCampaignsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCampaignsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  campaignsList: {
    flex: 1,
  },
  campaignCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  priorityCampaignCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#2a2a2a',
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  campaignAdventure: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 12,
  },
  campaignDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  campaignDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
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
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  modalBody: {
    padding: 20,
  },
  modalCampaignName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  adventureCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  adventureTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  adventureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 20,
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    width: '48%',
  },
  detailItemLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginBottom: 4,
  },
  detailItemValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  joinCampaignButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  joinCampaignButtonDisabled: {
    backgroundColor: '#666',
  },
  joinCampaignButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  campaignInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  campaignInfoNoteText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    flex: 1,
    lineHeight: 20,
  },
  excludedContentCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  excludedContentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ff6b6b',
    marginBottom: 12,
  },
  excludedContentList: {
    marginBottom: 8,
  },
  excludedContentItem: {
    marginBottom: 4,
  },
  excludedContentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 20,
  },
  excludedContentNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    fontStyle: 'italic',
  },
  playersCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  playersTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  playersList: {
    gap: 12,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  characterInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  playerCharacterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerCharacterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
  },
  playerCharacterDetails: {
    alignItems: 'flex-end',
  },
  playerCharacterName: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  playerCharacterClass: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  noCharacterText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    fontStyle: 'italic',
  },
});