import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, Scroll, CheckCircle } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { charactersAtom } from '../atoms/characterAtoms';
import { useScrollOfRebirthAtom } from '../atoms/userCapabilitiesAtoms';
import { useCustomAlert } from './CustomAlert';

interface ScrollSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScrollSelectionModal({ 
  isVisible, 
  onClose, 
  onSuccess 
}: ScrollSelectionModalProps) {
  const [characters] = useAtom(charactersAtom);
  const [, useScrollOfRebirth] = useAtom(useScrollOfRebirthAtom);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useCustomAlert();

  // Reset selection when modal opens
  useEffect(() => {
    if (isVisible) {
      setSelectedCharacterId(null);
    }
  }, [isVisible]);

  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
  };

  const handleConfirm = async () => {
    if (!selectedCharacterId) {
      showAlert(
        'No Character Selected',
        'Please select a character to receive the Scroll of Rebirth.',
        [{ text: 'OK' }],
        'error'
      );
      return;
    }

    setIsLoading(true);
    try {
      await useScrollOfRebirth(selectedCharacterId);
      
      const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
      
      showAlert(
        'Scroll Added!',
        `${selectedCharacter?.name} has received a Scroll of Rebirth! Check their equipment to use it.`,
        [{ text: 'Great!' }],
        'success'
      );
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding scroll to character:', error);
      showAlert(
        'Failed to Add Scroll',
        'There was an issue adding the scroll to your character. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Select Character</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/images/scrollRevive.png')} 
                style={styles.heroIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroTitle}>Scroll of Rebirth</Text>
            <Text style={styles.heroSubtitle}>
              Choose which character should receive this powerful revival scroll
            </Text>
          </View>

          {/* Character Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionTitle}>Your Characters</Text>
            
            {characters.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  You need to create a character first before you can assign a scroll.
                </Text>
                <TouchableOpacity 
                  style={styles.createCharacterButton}
                  onPress={onClose}
                >
                  <Text style={styles.createCharacterText}>Create Character</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.charactersList}>
                {characters.map((character) => (
                  <TouchableOpacity
                    key={character.id}
                    style={[
                      styles.characterCard,
                      selectedCharacterId === character.id && styles.characterCardSelected
                    ]}
                    onPress={() => handleSelectCharacter(character.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.characterInfo}>
                      <View style={styles.characterDetails}>
                        <Text style={styles.characterName}>{character.name}</Text>
                        <Text style={styles.characterClass}>
                          Level {character.level} {character.class}
                        </Text>
                        <Text style={styles.characterRace}>{character.race}</Text>
                      </View>
                      
                      {selectedCharacterId === character.id && (
                        <View style={styles.selectedIndicator}>
                          <CheckCircle size={24} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Confirm Button */}
          {characters.length > 0 && (
            <View style={styles.confirmSection}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedCharacterId || isLoading) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={!selectedCharacterId || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Scroll size={20} color="#000" />
                    <Text style={styles.confirmButtonText}>Add Scroll to Character</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(233, 30, 99, 0.3)',
  },
  heroIcon: {
    width: 60,
    height: 60,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  selectionSection: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  createCharacterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createCharacterText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
  charactersList: {
    gap: 12,
  },
  characterCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  characterCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterDetails: {
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  characterClass: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
    marginBottom: 2,
  },
  characterRace: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
  },
  selectedIndicator: {
    marginLeft: 16,
  },
  confirmSection: {
    padding: 24,
    paddingBottom: 40,
  },
  confirmButton: {
    backgroundColor: '#E91E63',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
}); 