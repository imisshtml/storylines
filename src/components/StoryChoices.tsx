import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface StoryChoicesProps {
  choices: string[];
  onChoiceSelect: (choice: string) => void;
  disabled?: boolean;
}

export default function StoryChoices({ choices, onChoiceSelect, disabled = false }: StoryChoicesProps) {
  if (choices.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your action:</Text>
      {choices.map((choice, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.choiceButton, disabled && styles.choiceButtonDisabled]}
          onPress={() => onChoiceSelect(choice)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.choiceText, disabled && styles.choiceTextDisabled]}>
            {choice}
          </Text>
          <ChevronRight 
            size={20} 
            color={disabled ? '#666' : '#fff'} 
            style={styles.choiceIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  choiceButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  choiceButtonDisabled: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
  },
  choiceText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
    marginRight: 8,
  },
  choiceTextDisabled: {
    color: '#666',
  },
  choiceIcon: {
    opacity: 0.7,
  },
});