import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

export type Adventure = {
  id: string;
  title: string;
  description: string;
};

export const ADVENTURES: Adventure[] = [
  {
    id: 'hollow-moor',
    title: 'Whispers of the Hollow Moor',
    description: 'A cursed moorland echoes with the voices of the dead. Villagers are disappearing at night, drawn toward a forgotten barrow where something ancient stirs beneath the peat.',
  },
  {
    id: 'ember-king',
    title: "The Ember King's Bargain",
    description: 'A tyrant once sealed away in molten stone has begun whispering through the dreams of fire mages. The party must race to stop a cult from unleashing his molten wrath on the realm.',
  },
  {
    id: 'bleeding-citadel',
    title: 'The Bleeding Citadel',
    description: 'A floating fortress crashes into the countryside, leaking red mist and twisted horrors. The players must explore its shattered halls and uncover its origin — before it bleeds into their world.',
  },
  {
    id: 'salt-wound',
    title: 'Salt in the Wound',
    description: "A coastal town's fishermen haul in not just strange fish, but relics and corpses from a lost undersea temple. Something waits beneath the tide, and it's hungry.",
  },
  {
    id: 'hollow-tree',
    title: 'Harvest of the Hollow Tree',
    description: 'Every ten years, the Great Tree blooms... and people vanish. This cycle, the players are chosen as "seedbearers" to enter the living realm beneath the roots and uncover a centuries-old pact.',
  },
  {
    id: 'drowned-saint',
    title: 'Dungeon of the Drowned Saint',
    description: "A holy order built a monastery atop a forgotten god's tomb. Now the water rises, and the dead walk. The players descend through flooded catacombs to find out what was never meant to surface.",
  },
  {
    id: 'blackspire',
    title: 'Broken Oaths of Blackspire',
    description: "A long-dead adventuring party's betrayal has cursed the ruins of Blackspire Keep. The players must uncover each member's sin and confront the echoes of their deeds to cleanse the land.",
  },
];

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (adventure: Adventure) => void;
  selectedId?: string;
};

export default function AdventureSelectSheet({ isVisible, onClose, onSelect, selectedId }: Props) {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <Text style={styles.title}>Select Adventure</Text>
          <ScrollView style={styles.scrollView}>
            {ADVENTURES.map((adventure) => (
              <TouchableOpacity
                key={adventure.id}
                style={[
                  styles.adventureCard,
                  selectedId === adventure.id && styles.selectedCard
                ]}
                onPress={() => {
                  onSelect(adventure);
                  onClose();
                }}
              >
                <Text style={[
                  styles.adventureTitle,
                  selectedId === adventure.id && styles.selectedText
                ]}>
                  {adventure.title}
                </Text>
                <Text style={[
                  styles.adventureDescription,
                  selectedId === adventure.id && styles.selectedText
                ]}>
                  {adventure.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '85%',
    padding: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  scrollView: {
    flex: 1,
  },
  adventureCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: '#4CAF50',
  },
  adventureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  adventureDescription: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  selectedText: {
    color: '#fff',
  },
}); 