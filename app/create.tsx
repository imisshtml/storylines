import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import CreateCampaignScreen from '../src/screens/CreateCampaignScreen';
import { currentCampaignAtom } from '../src/atoms/campaignAtoms';

export default function CreateTab() {
  const [, setCurrentCampaign] = useAtom(currentCampaignAtom);

  useEffect(() => {
    console.log(':::: reset')
    // Clear current campaign when accessing create tab to ensure fresh state
    setCurrentCampaign(null);
  }, [setCurrentCampaign]);

  return <CreateCampaignScreen />;
}