import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { 
  charactersToLevelUpAtom, 
  checkForLevelUpCharactersAtom,
  hasCharactersToLevelUpAtom,
} from '../atoms/levelUpAtoms';

export const useLevelUpNotification = () => {
  const [charactersToLevelUp] = useAtom(charactersToLevelUpAtom);
  const [hasCharactersToLevelUp] = useAtom(hasCharactersToLevelUpAtom);
  const [, checkForLevelUpCharacters] = useAtom(checkForLevelUpCharactersAtom);
  //const [, initializeRealtime] = useAtom(initializeCharacterLevelRealtimeAtom);
  const [showNotification, setShowNotification] = useState(false);

  // Initialize realtime subscription and check for level ups on mount
  useEffect(() => {
    checkForLevelUpCharacters();
  }, [checkForLevelUpCharacters]);

  // Show notification when characters to level up changes
  useEffect(() => {
    if (hasCharactersToLevelUp) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [hasCharactersToLevelUp]);

  const dismissNotification = () => {
    setShowNotification(false);
  };

  return {
    showNotification,
    dismissNotification,
    hasCharactersToLevelUp,
    charactersToLevelUp
  };
};