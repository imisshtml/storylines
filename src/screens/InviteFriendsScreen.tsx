import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import { currentCampaignAtom } from '../atoms/campaignAtoms';
import { Copy, Share as ShareIcon, Users, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';

export default function InviteFriendsScreen() {
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [copied, setCopied] = useState(false);

  if (!currentCampaign) {
    router.replace('/');
    return null;
  }

  const handleCopyCode = () => {
    // In a real app, implement clipboard functionality
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Storylines campaign! Use code: ${currentCampaign.inviteCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentCampaign.name}</Text>
      
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Invite Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{currentCampaign.inviteCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            {copied ? (
              <CheckCircle2 size={24} color="#4CAF50" />
            ) : (
              <Copy size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <ShareIcon size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Share Invite Link</Text>
      </TouchableOpacity>

      <View style={styles.waitingRoom}>
        <View style={styles.waitingHeader}>
          <Users size={20} color="#fff" />
          <Text style={styles.waitingTitle}>Waiting Room</Text>
        </View>
        
        <ScrollView style={styles.playersList}>
          {currentCampaign.players.map(player => (
            <View key={player.id} style={styles.playerItem}>
              <Text style={styles.playerName}>{player.name}</Text>
              {player.ready && (
                <CheckCircle2 size={20} color="#4CAF50" />
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={[styles.readyButton, currentCampaign.players.length < 2 && styles.readyButtonDisabled]}
        disabled={currentCampaign.players.length < 2}
      >
        <Text style={styles.readyButtonText}>Start Campaign</Text>
      </TouchableOpacity>
    </View>
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
    color: '#fff',
    marginBottom: 24,
    fontFamily: 'Inter-Bold',
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  codeBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
  },
  waitingRoom: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  playerName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  readyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  readyButtonDisabled: {
    backgroundColor: '#666',
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});