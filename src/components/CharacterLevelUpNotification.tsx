import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ImageBackground } from 'react-native';
import { useAtom } from 'jotai';
import { 
  charactersToLevelUpAtom, 
  startLevelUpProcessAtom,
  LevelUpCharacter
} from '../atoms/levelUpAtoms';
import { X } from 'lucide-react-native';

interface CharacterLevelUpNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function CharacterLevelUpNotification({
  isVisible,
  onClose
}: CharacterLevelUpNotificationProps) {
  const [charactersToLevelUp] = useAtom(charactersToLevelUpAtom);
  const [, startLevelUpProcess] = useAtom(startLevelUpProcessAtom);

  const handleLevelUpNow = (character: LevelUpCharacter) => {
    startLevelUpProcess(character.id);
    onClose();
  };

  const handleLevelUpLater = () => {
    onClose();
  };

  if (!isVisible || charactersToLevelUp.length === 0) {
    return null;
  }

  // Just show the first character that needs leveling up
  const character = charactersToLevelUp[0];

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <ImageBackground
        source={require('../../assets/images/levelup.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={styles.characterName}>
            {character.name}
          </Text>
          
          <Text style={styles.levelText}>
            has reached level {character.newLevel}!
          </Text>
          
          <Text style={styles.classInfo}>
            {character.race} {character.class}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.laterButton}
              onPress={handleLevelUpLater}
            >
              <Text style={styles.laterButtonText}>Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.levelUpButton}
              onPress={() => handleLevelUpNow(character)}
            >
              <Text style={styles.levelUpButtonText}>Level Up Now</Text>
            </TouchableOpacity>
          </View>
          
          {charactersToLevelUp.length > 1 && (
            <Text style={styles.additionalInfo}>
              +{charactersToLevelUp.length - 1} more {charactersToLevelUp.length - 1 === 1 ? 'character' : 'characters'} to level up
            </Text>
          )}
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    minWidth: '80%',
  },
  characterName: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  levelText: {
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  classInfo: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 32,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  laterButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  laterButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelUpButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  levelUpButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  additionalInfo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});