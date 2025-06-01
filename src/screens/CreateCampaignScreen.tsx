import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, AlertCircle } from 'lucide-react-native';

type Theme = {
  id: string;
  name: string;
  description: string;
};

type Tone = 'serious' | 'humorous' | 'grimdark';

const themes: Theme[] = [
  { id: 'fantasy', name: 'Fantasy', description: 'Dragons, magic, and epic quests' },
  { id: 'scifi', name: 'Sci-Fi', description: 'Space exploration and advanced technology' },
  { id: 'horror', name: 'Horror', description: 'Suspense and supernatural encounters' },
  { id: 'western', name: 'Western', description: 'Cowboys, outlaws, and frontier adventures' },
];

const contentTags = [
  'Gore',
  'Betrayal',
  'Horror',
  'Violence',
  'Death',
  'Romance',
];

export default function CreateCampaignScreen() {
  const [campaignName, setCampaignName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [startingLevel, setStartingLevel] = useState('1');
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setExcludedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Campaign</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Campaign Name</Text>
        <TextInput
          style={styles.input}
          value={campaignName}
          onChangeText={setCampaignName}
          placeholder="Enter campaign name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Choose Theme</Text>
        <View style={styles.themeGrid}>
          {themes.map(theme => (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeCard,
                selectedTheme === theme.id && styles.selectedTheme
              ]}
              onPress={() => setSelectedTheme(theme.id)}
            >
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.themeDescription}>{theme.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Starting Level (Optional)</Text>
        <TextInput
          style={styles.input}
          value={startingLevel}
          onChangeText={setStartingLevel}
          keyboardType="numeric"
          placeholder="Enter starting level"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Campaign Tone</Text>
        <View style={styles.toneContainer}>
          {(['serious', 'humorous', 'grimdark'] as Tone[]).map(tone => (
            <TouchableOpacity
              key={tone}
              style={[
                styles.toneButton,
                selectedTone === tone && styles.selectedTone
              ]}
              onPress={() => setSelectedTone(tone)}
            >
              <Text style={[
                styles.toneText,
                selectedTone === tone && styles.selectedToneText
              ]}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Content to Exclude</Text>
        <View style={styles.tagsContainer}>
          {contentTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                excludedTags.includes(tag) && styles.selectedTag
              ]}
              onPress={() => toggleTag(tag)}
            >
              {excludedTags.includes(tag) && (
                <AlertCircle size={16} color="#fff" style={styles.tagIcon} />
              )}
              <Text style={[
                styles.tagText,
                excludedTags.includes(tag) && styles.selectedTagText
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Create Campaign</Text>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  selectedTheme: {
    backgroundColor: '#4CAF50',
  },
  themeName: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  themeDescription: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  toneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toneButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  selectedTone: {
    backgroundColor: '#4CAF50',
  },
  toneText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedToneText: {
    fontFamily: 'Inter-Bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTag: {
    backgroundColor: '#E53935',
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedTagText: {
    fontFamily: 'Inter-Bold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    marginRight: 8,
    fontFamily: 'Inter-Bold',
  },
});