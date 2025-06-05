import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useAtom } from 'jotai';
import { currentCampaignAtom, campaignsLoadingAtom, campaignsErrorAtom, upsertCampaignAtom } from '../atoms/campaignAtoms';
import { Copy, Share as ShareIcon, Users, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ArrowLeft, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as SMS from 'expo-sms';

export default function InviteFriendsScreen() {
  const [currentCampaign] = useAtom(currentCampaignAtom);
  const [isLoading] = useAtom(campaignsLoadingAtom);
  const [error] = useAtom(campaignsErrorAtom);
  const [, upsertCampaign] = useAtom(upsertCampaignAtom);
  const [copied, setCopied] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [smsAvailable, setSmsAvailable] = useState(false);

  useEffect(() => {
    if (!currentCampaign) {
      router.replace('/');
    }
    checkSmsAvailability();
  }, [currentCampaign]);

  const checkSmsAvailability = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    setSmsAvailable(isAvailable);
  };

  const handleBack = () => {
    router.back();
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(currentCampaign.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Storylines campaign! Use code: ${currentCampaign.invite_code}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartCampaign = async () => {
    try {
      await upsertCampaign({
        ...currentCampaign,
        status: 'waiting',
      });
      router.replace('/story');
    } catch (err) {
      console.error('Error starting campaign:', err);
    }
  };

  const handleSendSMS = async () => {
    if (!phoneNumbers.trim()) return;

    const numbers = phoneNumbers.split(',').map(num => num.trim()).filter(Boolean);
    if (numbers.length === 0) return;

    try {
      const { result } = await SMS.sendSMSAsync(
        numbers,
        `Join me on Storylines! Use my invite code ${currentCampaign.invite_code} and download the app here: https://linkTBD`
      );
      
      if (result === 'sent') {
        setPhoneNumbers('');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{currentCampaign.name}</Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle color="#f44336" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Invite Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{currentCampaign.invite_code}</Text>
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

      {smsAvailable && (
        <View style={styles.smsContainer}>
          <Text style={styles.smsLabel}>Invite via SMS</Text>
          <View style={styles.smsInputContainer}>
            <TextInput
              style={styles.smsInput}
              value={phoneNumbers}
              onChangeText={setPhoneNumbers}
              placeholder="Enter phone numbers (comma-separated)"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={[styles.smsButton, !phoneNumbers.trim() && styles.smsButtonDisabled]}
              onPress={handleSendSMS}
              disabled={!phoneNumbers.trim()}
            >
              <Send size={20} color={phoneNumbers.trim() ? '#fff' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
        style={styles.readyButton}
        onPress={handleStartCampaign}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
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
    marginHorizontal: 20,
    marginBottom: 20,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  codeContainer: {
    marginHorizontal: 20,
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
    marginHorizontal: 20,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Bold',
  },
  smsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  smsLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  smsInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  smsInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  smsButton: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  waitingRoom: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
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
    marginBottom: 24,
    marginHorizontal: 20,
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});