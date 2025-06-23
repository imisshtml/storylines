import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useAtom } from 'jotai';
import { 
  charactersToLevelUpAtom, 
  startLevelUpProcessAtom,
  LevelUpCharacter
} from '../atoms/levelUpAtoms';
import { ArrowUp, X } from 'lucide-react-native';

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
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.levelUpIcon}>
            <ArrowUp size={32} color="#fff" />
          </View>
          
          <Text style={styles.title}>Level Up Available!</Text>
          
          <Text style={styles.message}>
            {character.name} has reached level {character.newLevel}!
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelUpIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    marginBottom: 8,
    textAlign: 'center',
  },
  classInfo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  laterButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  levelUpButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FF9800',
  },
  levelUpButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  additionalInfo: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
  },
});