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
    const canCreate = await checkUserLimit('character', characters.length);
    
    if (!canCreate) {
      showAlert(
        'Character Limit Reached',
        `You can only create ${userCapabilities.characterLimit} characters. Purchase character limit upgrades in the shop to create more characters.`,
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
    
    // Count campaigns where user is either owner or player
    const userCampaigns = campaigns.filter(campaign => 
      campaign.owner === user.id || campaign.players?.some(player => player.id === user.id)
    );
    
    const canCreate = await checkUserLimit('campaign', userCampaigns.length);
    
    if (!canCreate) {
      showAlert(
        'Campaign Limit Reached',
        `You can only create/join ${userCapabilities.campaignLimit} campaigns. Purchase campaign limit upgrades in the shop to join more campaigns.`,
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

  const getCharacterLimitInfo = () => ({
    current: characters.length,
    max: userCapabilities.characterLimit,
    canCreate: characters.length < userCapabilities.characterLimit,
  });

  const getCampaignLimitInfo = () => {
    if (!user?.id) return { current: 0, max: userCapabilities.campaignLimit, canJoin: true };
    
    const userCampaigns = campaigns.filter(campaign => 
      campaign.owner === user.id || campaign.players?.some(player => player.id === user.id)
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