import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAtom } from 'jotai';
import { charactersAtom, fetchCharactersAtom, type Character } from '../atoms/characterAtoms';
import CharacterView from '../components/CharacterView';
import ActivityIndicator from '../components/ActivityIndicator';
import { useLoading } from '../hooks/useLoading';

export default function CharacterViewScreen() {
  const params = useLocalSearchParams();
  const characterId = params.characterId as string;
  const [characters] = useAtom(charactersAtom);
  const [, fetchCharacters] = useAtom(fetchCharactersAtom);
  const [character, setCharacter] = useState<Character | null>(null);
  const { isLoading, withLoading } = useLoading();

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        await withLoading(fetchCharacters, 'fetchCharacters')();
      } catch (error) {
        console.error('Error loading characters:', error);
      }
    };

    loadCharacter();
  }, [fetchCharacters, withLoading]);

  useEffect(() => {
    if (characterId && characters.length > 0) {
      const foundCharacter = characters.find(char => char.id === characterId);
      setCharacter(foundCharacter || null);
    }
  }, [characterId, characters]);

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = async () => {
    try {
      await withLoading(fetchCharacters, 'refreshCharacter')();
    } catch (error) {
      console.error('Error refreshing character:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {character ? character.name : 'Character'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ActivityIndicator 
        isLoading={isLoading('fetchCharacters')} 
        text="Loading character..." 
        style={styles.content}
      >
        <View style={styles.content}>
          <CharacterView 
            character={character} 
            onRefresh={handleRefresh}
          />
        </View>
      </ActivityIndicator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
});