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
import { Send, Home, User2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { currentCampaignAtom } from '../atoms/campaignAtoms';

export default function StoryScreen() {
  const [userInput, setUserInput] = useState('');
  const [currentCampaign] = useAtom(currentCampaignAtom);

  const handleSend = () => {
    if (userInput.trim()) {
      // Handle sending the user's input
      setUserInput('');
    }
  };

  const handleHomePress = () => {
    router.push('/index');
  };

  const handleCharacterPress = () => {
    router.push('/story/character');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/paper_background.jpg')}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHomePress} style={styles.headerButton}>
            <Home size={24} color="#2a2a2a" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{currentCampaign?.name || 'The Dark Forest'}</Text>
            <Text style={styles.subtitle}>Chapter 1: The Beginning</Text>
          </View>

          <TouchableOpacity onPress={handleCharacterPress} style={styles.headerButton}>
            <User2 size={24} color="#2a2a2a" />
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#2a2a2a',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#2a2a2a',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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