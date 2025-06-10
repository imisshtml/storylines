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
import { DEFAULT_AVATARS, AVATAR_CATEGORIES, getRandomAvatarSelection, type DefaultAvatar } from '../data/defaultAvatars';
import { pickAndUploadAvatar, type AvatarUploadResult } from '../utils/avatarStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const getAvatarsToShow = () => {
    if (selectedCategory === 'all') {
      return DEFAULT_AVATARS;
    }
    return DEFAULT_AVATARS.filter(avatar => avatar.category === selectedCategory);
  };

  const handleDefaultAvatarSelect = (avatar: DefaultAvatar) => {
    onAvatarSelect(avatar.imagePath);
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

  const isCurrentAvatar = (avatarUrl: any) => {
    // For local images (require() results), we need to compare differently
    // Since currentAvatar might be a require() result or a URL string
    if (typeof currentAvatar === 'string' && typeof avatarUrl === 'string') {
      return currentAvatar === avatarUrl;
    }
    // For require() results, they should be the same object reference
    return currentAvatar === avatarUrl;
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

          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {AVATAR_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.id && styles.activeCategoryTab
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.activeCategoryTabText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Avatar Grid */}
          <ScrollView style={styles.avatarGrid} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarRow}>
              {getAvatarsToShow().map((avatar, index) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    isCurrentAvatar(avatar.imagePath) && styles.selectedAvatarItem
                  ]}
                  onPress={() => handleDefaultAvatarSelect(avatar)}
                >
                  <Image source={avatar.imagePath} style={styles.avatarImage} />
                  {isCurrentAvatar(avatar.imagePath) && (
                    <View style={styles.selectedOverlay}>
                      <Sparkles size={24} color="#fff" />
                    </View>
                  )}
                  <Text style={styles.avatarName} numberOfLines={1}>
                    {avatar.name}
                  </Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
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
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  activeCategoryTab: {
    backgroundColor: '#4CAF50',
  },
  categoryEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryTabText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
  },
  activeCategoryTabText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  avatarGrid: {
    flex: 1,
    padding: 20,
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
    position: 'relative',
  },
  selectedAvatarItem: {
    transform: [{ scale: 1.05 }],
  },
  avatarImage: {
    width: AVATAR_SIZE - 8,
    height: AVATAR_SIZE - 8,
    borderRadius: (AVATAR_SIZE - 8) / 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: (AVATAR_SIZE - 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarName: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginTop: 4,
    width: AVATAR_SIZE,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});