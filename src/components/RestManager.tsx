import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Moon, Clock, RefreshCw, Zap } from 'lucide-react-native';
import { 
  Character, 
  needsShortRest, 
  needsLongRest,
  performShortRest,
  performLongRest 
} from '../atoms/characterAtoms';

interface RestManagerProps {
  character: Character;
  onRestCompleted: () => void;
}

export default function RestManager({ character, onRestCompleted }: RestManagerProps) {
  const needsShort = needsShortRest(character);
  const needsLong = needsLongRest(character);

  const handleShortRest = () => {
    Alert.alert(
      'Take Short Rest',
      'This will restore abilities that recharge on a short rest. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rest',
          onPress: async () => {
            try {
              await performShortRest(character.id);
              onRestCompleted();
              Alert.alert('Short Rest Complete', 'Your abilities have been restored!');
            } catch (error) {
              console.error('Error taking short rest:', error);
              Alert.alert('Error', 'Failed to complete short rest. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLongRest = () => {
    Alert.alert(
      'Take Long Rest',
      'This will restore all spell slots and abilities that recharge on a long rest. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rest',
          onPress: async () => {
            try {
              await performLongRest(character.id);
              onRestCompleted();
              Alert.alert('Long Rest Complete', 'All spell slots and abilities have been restored!');
            } catch (error) {
              console.error('Error taking long rest:', error);
              Alert.alert('Error', 'Failed to complete long rest. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getShortRestBenefits = (): string[] => {
    const benefits: string[] = [];
    const featureUses = character.feature_uses || {};
    const traitUses = character.trait_uses || {};

    // Check for short rest abilities
    for (const [key, ability] of Object.entries(featureUses)) {
      if (ability.resets_on === 'short' && ability.used > 0) {
        benefits.push(`${key} (${ability.used}/${ability.max} used)`);
      }
    }

    for (const [key, ability] of Object.entries(traitUses)) {
      if (ability.resets_on === 'short' && ability.used > 0) {
        benefits.push(`${key} (${ability.used}/${ability.max} used)`);
      }
    }

    if (benefits.length === 0) {
      benefits.push('No short rest abilities to restore');
    }

    return benefits;
  };

  const getLongRestBenefits = (): string[] => {
    const benefits: string[] = [];
    const spellSlotsUsed = character.spell_slots_used || {};
    const featureUses = character.feature_uses || {};
    const traitUses = character.trait_uses || {};

    // Check spell slots
    let hasUsedSpells = false;
    for (const [level, used] of Object.entries(spellSlotsUsed)) {
      if (used > 0) {
        benefits.push(`Level ${level} spell slots (${used} used)`);
        hasUsedSpells = true;
      }
    }

    if (!hasUsedSpells) {
      benefits.push('All spell slots available');
    }

    // Check for long rest abilities
    let hasLongRestAbilities = false;
    for (const [key, ability] of Object.entries(featureUses)) {
      if (ability.resets_on === 'long' && ability.used > 0) {
        benefits.push(`${key} (${ability.used}/${ability.max} used)`);
        hasLongRestAbilities = true;
      }
    }

    for (const [key, ability] of Object.entries(traitUses)) {
      if (ability.resets_on === 'long' && ability.used > 0) {
        benefits.push(`${key} (${ability.used}/${ability.max} used)`);
        hasLongRestAbilities = true;
      }
    }

    if (!hasLongRestAbilities && !hasUsedSpells) {
      benefits.push('No long rest abilities to restore');
    }

    return benefits;
  };

  const shortRestBenefits = getShortRestBenefits();
  const longRestBenefits = getLongRestBenefits();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rest Management</Text>
      
      {/* Short Rest */}
      <View style={styles.restContainer}>
        <View style={styles.restHeader}>
          <View style={styles.restTitleContainer}>
            <Clock size={20} color="#FFA726" />
            <Text style={styles.restTitle}>Short Rest</Text>
            {needsShort && <Zap size={16} color="#FF9800" />}
          </View>
          <TouchableOpacity
            style={[styles.restButton, styles.shortRestButton]}
            onPress={handleShortRest}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.restButtonText}>Take Short Rest</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Will restore:</Text>
          {shortRestBenefits.map((benefit, index) => (
            <Text key={index} style={styles.benefitText}>• {benefit}</Text>
          ))}
        </View>
      </View>

      {/* Long Rest */}
      <View style={styles.restContainer}>
        <View style={styles.restHeader}>
          <View style={styles.restTitleContainer}>
            <Moon size={20} color="#5C6BC0" />
            <Text style={styles.restTitle}>Long Rest</Text>
            {needsLong && <Zap size={16} color="#FF9800" />}
          </View>
          <TouchableOpacity
            style={[styles.restButton, styles.longRestButton]}
            onPress={handleLongRest}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.restButtonText}>Take Long Rest</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Will restore:</Text>
          {longRestBenefits.map((benefit, index) => (
            <Text key={index} style={styles.benefitText}>• {benefit}</Text>
          ))}
        </View>
      </View>

      {(needsShort || needsLong) && (
        <View style={styles.recommendationContainer}>
          <Zap size={16} color="#FF9800" />
          <Text style={styles.recommendationText}>
            {needsLong 
              ? 'Recommended: Take a long rest to restore spell slots and abilities'
              : 'Recommended: Take a short rest to restore abilities'
            }
          </Text>
        </View>
      )}
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
    marginBottom: 16,
  },
  restContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  restHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  restButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shortRestButton: {
    backgroundColor: '#FFA726',
  },
  longRestButton: {
    backgroundColor: '#5C6BC0',
  },
  restButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  benefitText: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  recommendationText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
}); 