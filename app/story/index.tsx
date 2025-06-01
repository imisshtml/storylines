import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';

export default function StoryScreen() {
  const [userInput, setUserInput] = useState('');

  const handleSend = () => {
    if (userInput.trim()) {
      // Handle sending the user's input
      setUserInput('');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>The Dark Forest</Text>
          <Text style={styles.subtitle}>Chapter 1: The Beginning</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView style={styles.storyContainer}>
            <Text style={styles.storyText}>
              The ancient trees loomed overhead, their branches intertwining to form a dense canopy that barely allowed any sunlight to penetrate. The air was thick with an otherworldly presence, and the silence was deafening. Your journey begins here, in the heart of the Dark Forest...
            </Text>

            <View style={styles.choicesContainer}>
              <TouchableOpacity style={styles.choiceButton}>
                <Text style={styles.choiceText}>Explore deeper into the forest</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.choiceButton}>
                <Text style={styles.choiceText}>Search for signs of civilization</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.choiceButton}>
                <Text style={styles.choiceText}>Set up camp for the night</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Write your own action..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!userInput.trim()}
            >
              <Send size={24} color={userInput.trim() ? '#fff' : '#666'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  storyContainer: {
    flex: 1,
    padding: 16,
  },
  storyText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Inter-Regular',
    lineHeight: 28,
    marginBottom: 24,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  choiceText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
    marginBottom: 49, // Height of tab bar
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
});