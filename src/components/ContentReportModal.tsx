import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Flag, ChevronDown, Send } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { useAtom } from 'jotai';
import { userAtom } from '../atoms/authAtoms';
import { CampaignMessage } from '../atoms/campaignHistoryAtoms';

interface ContentReportModalProps {
  visible: boolean;
  onClose: () => void;
  message: CampaignMessage | null;
  campaignId: string;
}

const OFFENSE_TYPES = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'violence', label: 'Violence or Threats' },
  { value: 'adult_content', label: 'Adult/Sexual Content' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'spam', label: 'Spam or Irrelevant Content' },
  { value: 'other', label: 'Other' },
];

export default function ContentReportModal({ 
  visible, 
  onClose, 
  message, 
  campaignId 
}: ContentReportModalProps) {
  const [user] = useAtom(userAtom);
  const [selectedOffense, setSelectedOffense] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!selectedOffense || !message || !user) {
      Alert.alert('Error', 'Please select an offense type.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_user_id: user.id,
          campaign_id: campaignId,
          message_id: message.id,
          message_content: message.message,
          offense_type: selectedOffense,
          comments: comments.trim() || null,
        });

      if (error) throw error;

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it and take appropriate action if necessary.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Error', 
        'Failed to submit report. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedOffense('');
    setComments('');
    setShowDropdown(false);
    onClose();
  };

  const getSelectedOffenseLabel = () => {
    const selected = OFFENSE_TYPES.find(type => type.value === selectedOffense);
    return selected ? selected.label : 'Select reason for report';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Flag size={24} color="#ff4444" />
              <Text style={styles.headerTitle}>Report Content</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Message Preview */}
            <View style={styles.messagePreview}>
              <Text style={styles.sectionTitle}>Reported Content</Text>
              <View style={styles.messageContainer}>
                <Text style={styles.messageAuthor}>
                  {message?.message_type === 'gm' ? 'Storyteller' : 
                   message?.character_name || message?.author}
                </Text>
                <ScrollView 
                  style={styles.messageScrollContainer}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <Text style={styles.messageContent}>
                    {message?.message}
                  </Text>
                </ScrollView>
                <Text style={styles.messageTime}>
                  {message ? new Date(message.timestamp).toLocaleString() : ''}
                </Text>
              </View>
            </View>

            {/* Offense Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason for Report *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={[
                  styles.dropdownText,
                  !selectedOffense && styles.placeholderText
                ]}>
                  {getSelectedOffenseLabel()}
                </Text>
                <ChevronDown 
                  size={20} 
                  color="#666" 
                  style={[
                    styles.dropdownIcon,
                    showDropdown && styles.dropdownIconRotated
                  ]} 
                />
              </TouchableOpacity>
            </View>

            {/* Comments - only show when dropdown is closed */}
            {!showDropdown && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={comments}
                    onChangeText={setComments}
                    placeholder="Provide additional details about why you're reporting this content..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                  <Text style={styles.characterCount}>
                    {comments.length}/500 characters
                  </Text>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                  <Text style={styles.disclaimerText}>
                    Reports are reviewed by our moderation team. False reports may result in action against your account.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Dropdown Menu - positioned outside ScrollView */}
          {showDropdown && (
            <View style={styles.dropdownOverlay}>
              <ScrollView 
                style={styles.dropdownMenuFixed}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {OFFENSE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.dropdownItem,
                      selectedOffense === type.value && styles.selectedDropdownItem
                    ]}
                    onPress={() => {
                      setSelectedOffense(type.value);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedOffense === type.value && styles.selectedDropdownItemText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedOffense || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!selectedOffense || isSubmitting}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  messagePreview: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  messageContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  messageScrollContainer: {
    maxHeight: 120,
    marginBottom: 8,
  },
  messageAuthor: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 24,
    position: 'relative',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 56,
  },
  dropdownText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  placeholderText: {
    color: '#666',
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 240,
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    zIndex: 1000,
    elevation: 10,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  dropdownMenuFixed: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 400,
    width: '100%',
    maxWidth: 320,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    minHeight: 48,
    justifyContent: 'center',
  },
  selectedDropdownItem: {
    backgroundColor: '#ff4444',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  selectedDropdownItemText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#333',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 18,
    gap: 8,
    minHeight: 56,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
}); 