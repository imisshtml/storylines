import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Upload, Sparkles } from 'lucide-react-native';
import { DEFAULT_AVATARS, type DefaultAvatar } from '../data/defaultAvatars';
import { pickAndUploadAvatar, type AvatarUploadResult } from '../utils/avatarStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = (SCREEN_WIDTH - 80) / 4; // 4 avatars per row with padding

interface AvatarSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onAvatarSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
  userId: string;
  characterId?: string;
}

export default function AvatarSelector({
  isVisible,
  onClose,
  onAvatarSelect,
  currentAvatar,
  userId,
  characterId,
}: AvatarSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleDefaultAvatarSelect = (avatar: DefaultAvatar) => {
    // Pass the avatar ID instead of the require() result
    // We'll store the ID and resolve it when displaying
    onAvatarSelect(`default:${avatar.id}`);
    onClose();
  };

  const handleCustomUpload = async () => {
    setIsUploading(true);
    try {
      const result: AvatarUploadResult = await pickAndUploadAvatar(
        userId,
        characterId,
        setUploadProgress
      );

      if (result.success && result.url) {
        onAvatarSelect(result.url);
        onClose();
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const isCurrentAvatar = (avatar: DefaultAvatar) => {
    // Check if current avatar matches this default avatar
    return currentAvatar === `default:${avatar.id}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Avatar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Custom Upload Section */}
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={handleCustomUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small\" color="#fff" />
                  <Text style={styles.uploadButtonText}>
                    {uploadProgress || 'Uploading...'}
                  </Text>
                </>
              ) : (
                <>
                  <Upload size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload Custom Image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Default Avatars</Text>
            <Text style={styles.sectionSubtitle}>Choose from {DEFAULT_AVATARS.length} available options</Text>
          </View>

          {/* Avatar Grid */}
          <ScrollView 
            style={styles.avatarGrid} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avatarGridContent}
          >
            <View style={styles.avatarRow}>
              {DEFAULT_AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    isCurrentAvatar(avatar) && styles.selectedAvatarItem
                  ]}
                  onPress={() => handleDefaultAvatarSelect(avatar)}
                >
                  <View style={styles.avatarImageContainer}>
                    <Image source={avatar.imagePath} style={styles.avatarImage} />
                    {isCurrentAvatar(avatar) && (
                      <View style={styles.selectedOverlay}>
                        <Sparkles size={20} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Info Text */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              Choose from our curated collection or upload your own custom image
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '95%',
    height: SCREEN_HEIGHT * 0.85, // 85% of screen height
    maxHeight: 700,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  uploadSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#666',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  sectionHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
  },
  avatarGrid: {
    flex: 1,
  },
  avatarGridContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarItem: {
    width: AVATAR_SIZE,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedAvatarItem: {
    transform: [{ scale: 1.05 }],
  },
  avatarImageContainer: {
    position: 'relative',
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: (AVATAR_SIZE - 8) / 2,
    borderWidth: 2,
    borderColor: '#333',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: (AVATAR_SIZE - 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});