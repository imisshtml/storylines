import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight, CircleAlert as AlertCircle, Save } from 'lucide-react-native';
import { useAtom } from 'jotai';
import { campaignsLoadingAtom, campaignsErrorAtom, currentCampaignAtom, upsertCampaignAtom, type Campaign } from '../atoms/campaignAtoms';
import { router } from 'expo-router';
import { supabase } from '../config/supabase';

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
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [isLoading] = useAtom(campaignsLoadingAtom);
  const [error] = useAtom(campaignsErrorAtom);
  const [, upsertCampaign] = useAtom(upsertCampaignAtom);
  
  const [campaignName, setCampaignName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [startingLevel, setStartingLevel] = useState('1');
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);

  const isEditing = currentCampaign !== null;

  useEffect(() => {
    if (currentCampaign) {
      setCampaignName(currentCampaign.name);
      setSelectedTheme(currentCampaign.theme);
      setStartingLevel(currentCampaign.level.toString());
      setSelectedTone(currentCampaign.tone);
      setExcludedTags(currentCampaign.exclude || []);
    }
  }, [currentCampaign]);

  const toggleTag = (tag: string) => {
    setExcludedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!campaignName || !selectedTheme || !selectedTone) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const campaignData: Partial<Campaign> = {
        id: currentCampaign?.id,
        name: campaignName,
        theme: selectedTheme,
        level: parseInt(startingLevel, 10),
        tone: selectedTone,
        exclude: excludedTags,
        status: 'creation',
        players: currentCampaign?.players || [{
          id: user.id,
          name: 'Game Master',
          ready: false,
        }],
        invite_code: currentCampaign?.invite_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        owner: user.id,
      };

      await upsertCampaign(campaignData);
      router.push(isEditing ? '/' : '/invite');
    } catch (err) {
      console.error('Error saving campaign:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color="#f44336" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
        <Text style={styles.label}>Starting Level</Text>
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

      <TouchableOpacity 
        style={[
          styles.actionButton,
          (!campaignName || !selectedTheme || !selectedTone) && styles.actionButtonDisabled
        ]}
        onPress={handleSave}
        disabled={!campaignName || !selectedTheme || !selectedTone}
      >
        {isEditing ? (
          <>
            <Save size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Save Changes</Text>
          </>
        ) : (
          <>
            <Text style={styles.actionButtonText}>Create Campaign</Text>
            <ChevronRight size={20} color="#fff" />
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1515',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
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
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  actionButtonDisabled: {
    backgroundColor: '#666',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    marginHorizontal: 8,
    fontFamily: 'Inter-Bold',
  },
});