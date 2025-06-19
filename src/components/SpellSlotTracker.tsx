import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Square } from 'lucide-react-native';
import { Character, getSpellSlotsUsed, getSpellSlotsMax, getSpellSlotsRemaining } from '../atoms/characterAtoms';

interface SpellSlotTrackerProps {
  character: Character;
  onUseSpellSlot: (level: number) => void;
  onRestoreSpellSlot: (level: number) => void;
}

export default function SpellSlotTracker({ character, onUseSpellSlot, onRestoreSpellSlot }: SpellSlotTrackerProps) {
  // Get spell levels that the character has slots for
  const getAvailableSpellLevels = (): number[] => {
    const levels: number[] = [];
    for (let i = 1; i <= 9; i++) {
      if (getSpellSlotsMax(character, i) > 0) {
        levels.push(i);
      }
    }
    return levels;
  };

  const availableLevels = getAvailableSpellLevels();

  if (availableLevels.length === 0) {
    return null; // Character has no spell slots
  }

  const renderSpellSlots = (level: number) => {
    const maxSlots = getSpellSlotsMax(character, level);
    const usedSlots = getSpellSlotsUsed(character, level);
    const slots = [];

    for (let i = 0; i < maxSlots; i++) {
      const isUsed = i < usedSlots;
      slots.push(
        <TouchableOpacity
          key={i}
          style={[styles.slotBox, isUsed && styles.usedSlot]}
          onPress={() => {
            if (isUsed) {
              onRestoreSpellSlot(level);
            } else {
              onUseSpellSlot(level);
            }
          }}
        >
          {isUsed ? (
            <Check size={16} color="#fff" />
          ) : (
            <Square size={16} color="#4CAF50" />
          )}
        </TouchableOpacity>
      );
    }

    return slots;
  };

  const getOrdinalSuffix = (num: number): string => {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spell Slots</Text>
      {availableLevels.map((level) => {
        const remaining = getSpellSlotsRemaining(character, level);
        const max = getSpellSlotsMax(character, level);
        
        return (
          <View key={level} style={styles.levelContainer}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelText}>
                {level}{getOrdinalSuffix(level)} Level
              </Text>
              <Text style={styles.countText}>
                {remaining}/{max}
              </Text>
            </View>
            <View style={styles.slotsContainer}>
              {renderSpellSlots(level)}
            </View>
          </View>
        );
      })}
      <Text style={styles.helpText}>
        Tap empty slots to use • Tap filled slots to restore
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  levelContainer: {
    marginBottom: 12,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  countText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedSlot: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  helpText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 