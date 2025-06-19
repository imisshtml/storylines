import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Moon, Sun, Clock, AlertCircle } from 'lucide-react-native';
import { 
  Character, 
  getAbilityUses, 
  canUseAbility, 
  getAbilityUsesRemaining,
  AbilityUse 
} from '../atoms/characterAtoms';

interface AbilityUsageTrackerProps {
  character: Character;
  abilities: {
    key: string;
    name: string;
    type: 'feature' | 'trait';
    description?: string;
  }[];
  onUseAbility: (abilityKey: string, type: 'feature' | 'trait') => void;
  onRestoreAbility: (abilityKey: string, type: 'feature' | 'trait') => void;
}

export default function AbilityUsageTracker({ 
  character, 
  abilities, 
  onUseAbility, 
  onRestoreAbility 
}: AbilityUsageTrackerProps) {
  
  if (abilities.length === 0) {
    return null;
  }

  const getRestIcon = (resets_on: string) => {
    switch (resets_on) {
      case 'short':
        return <Clock size={14} color="#FFA726" />;
      case 'long':
        return <Moon size={14} color="#5C6BC0" />;
      default:
        return <Sun size={14} color="#66BB6A" />;
    }
  };

  const getRestText = (resets_on: string) => {
    switch (resets_on) {
      case 'short':
        return 'Short Rest';
      case 'long':
        return 'Long Rest';
      default:
        return 'No Rest';
    }
  };

  const renderUsageCircles = (abilityUse: AbilityUse, abilityKey: string, type: 'feature' | 'trait') => {
    const circles = [];
    const { used, max } = abilityUse;

    for (let i = 0; i < max; i++) {
      const isUsed = i < used;
      circles.push(
        <TouchableOpacity
          key={i}
          style={[styles.usageCircle, isUsed && styles.usedCircle]}
          onPress={() => {
            if (isUsed) {
              onRestoreAbility(abilityKey, type);
            } else {
              onUseAbility(abilityKey, type);
            }
          }}
        >
          {isUsed && <View style={styles.usedDot} />}
        </TouchableOpacity>
      );
    }

    return circles;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ability Usage</Text>
      {abilities.map((ability) => {
        const abilityUse = getAbilityUses(character, ability.key, ability.type);
        const canUse = canUseAbility(character, ability.key, ability.type);
        const remaining = getAbilityUsesRemaining(character, ability.key, ability.type);

        // If no usage tracking data, don't show this ability
        if (!abilityUse) {
          return null;
        }

        const isExhausted = !canUse && remaining === 0;

        return (
          <View key={`${ability.type}-${ability.key}`} style={styles.abilityContainer}>
            <View style={styles.abilityHeader}>
              <View style={styles.abilityInfo}>
                <Text style={[styles.abilityName, isExhausted && styles.exhaustedText]}>
                  {ability.name}
                </Text>
                <View style={styles.restInfo}>
                  {getRestIcon(abilityUse.resets_on)}
                  <Text style={styles.restText}>
                    {getRestText(abilityUse.resets_on)}
                  </Text>
                </View>
              </View>
              <View style={styles.usageInfo}>
                <Text style={[styles.usageCount, isExhausted && styles.exhaustedText]}>
                  {remaining}/{abilityUse.max}
                </Text>
                {isExhausted && (
                  <AlertCircle size={16} color="#F44336" style={styles.exhaustedIcon} />
                )}
              </View>
            </View>
            
            <View style={styles.usageContainer}>
              {renderUsageCircles(abilityUse, ability.key, ability.type)}
            </View>

            {ability.description && (
              <Text style={styles.abilityDescription}>{ability.description}</Text>
            )}
          </View>
        );
      })}
      <Text style={styles.helpText}>
        Tap filled circles to restore • Tap empty circles to use
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
  abilityContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  abilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  abilityInfo: {
    flex: 1,
  },
  abilityName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exhaustedText: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  restInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restText: {
    color: '#888',
    fontSize: 12,
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageCount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  exhaustedIcon: {
    marginLeft: 4,
  },
  usageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  usageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedCircle: {
    backgroundColor: '#4CAF50',
  },
  usedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  abilityDescription: {
    color: '#ccc',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  helpText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 