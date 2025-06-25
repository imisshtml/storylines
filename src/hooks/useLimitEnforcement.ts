import { useAtom } from 'jotai';
import { router } from 'expo-router';
import { 
  userCapabilitiesAtom, 
  checkUserLimitAtom 
} from '../atoms/userCapabilitiesAtoms';
import { charactersAtom } from '../atoms/characterAtoms';
import { campaignsAtom } from '../atoms/campaignAtoms';
import { userAtom } from '../atoms/authAtoms';
import { useCustomAlert } from '../components/CustomAlert';

export const useLimitEnforcement = () => {
  const [user] = useAtom(userAtom);
  const [userCapabilities] = useAtom(userCapabilitiesAtom);
  const [characters] = useAtom(charactersAtom);
  const [campaigns] = useAtom(campaignsAtom);
  const [, checkUserLimit] = useAtom(checkUserLimitAtom);
  const { showAlert } = useCustomAlert();

  const checkCharacterLimit = async (): Promise<boolean> => {
    // Only count non-retired characters
    const activeCharacters = characters.filter(character => !character.retired);
    const canCreate = await checkUserLimit('character', activeCharacters.length);
    
    if (!canCreate) {
      showAlert(
        'Character Limit Reached',
        `You can only create ${userCapabilities.characterLimit} active characters. Purchase character limit upgrades in the shop to create more characters.`,
        [
          {
            text: 'Go to Shop',
            onPress: () => {
              router.push('/shop');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        'warning'
      );
      return false;
    }
    
    return true;
  };

  const checkCampaignLimit = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    // Count campaigns where user is either owner or player, excluding completed/failed campaigns
    const userCampaigns = campaigns.filter(campaign => 
      (campaign.owner === user.id || campaign.players?.some(player => player.id === user.id)) &&
      campaign.status !== 'completed' && campaign.status !== 'failed'
    );
    
    const canCreate = await checkUserLimit('campaign', userCampaigns.length);
    
    if (!canCreate) {
      showAlert(
        'Campaign Limit Reached',
        `You can only create/join ${userCapabilities.campaignLimit} active campaigns. Purchase campaign limit upgrades in the shop to join more campaigns.`,
        [
          {
            text: 'Go to Shop',
            onPress: () => {
              router.push('/shop');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        'warning'
      );
      return false;
    }
    
    return true;
  };

  const getCharacterLimitInfo = () => {
    const activeCharacters = characters.filter(character => !character.retired);
    return {
      current: activeCharacters.length,
      max: userCapabilities.characterLimit,
      canCreate: activeCharacters.length < userCapabilities.characterLimit,
    };
  };

  const getCampaignLimitInfo = () => {
    if (!user?.id) return { current: 0, max: userCapabilities.campaignLimit, canJoin: true };
    
    const userCampaigns = campaigns.filter(campaign => 
      (campaign.owner === user.id || campaign.players?.some(player => player.id === user.id)) &&
      campaign.status !== 'completed' && campaign.status !== 'failed'
    );
    
    return {
      current: userCampaigns.length,
      max: userCapabilities.campaignLimit,
      canJoin: userCampaigns.length < userCapabilities.campaignLimit,
    };
  };

  const getGroupSizeLimit = () => userCapabilities.groupSizeLimit;

  const canAccessAllAdventures = () => userCapabilities.allAdventuresUnlocked;

  const shouldShowAds = () => !userCapabilities.adsRemoved;

  const getScrollsOfRebirth = () => userCapabilities.scrollsOfRebirth;

  return {
    checkCharacterLimit,
    checkCampaignLimit,
    getCharacterLimitInfo,
    getCampaignLimitInfo,
    getGroupSizeLimit,
    canAccessAllAdventures,
    shouldShowAds,
    getScrollsOfRebirth,
    userCapabilities,
  };
}; 