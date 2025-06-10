import { supabase } from '../config/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { DEFAULT_AVATARS, getRandomAvatarSelection, type DefaultAvatar, getAvatarById } from '../data/defaultAvatars';

export type AvatarUploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Get default avatar for character creation
 */
export const getDefaultAvatar = (): string => {
  const randomSelection = getRandomAvatarSelection(1);
  return `default:${randomSelection[0].id}`;
};

/**
 * Get a random fantasy portrait from defaults
 */
export const getRandomFantasyPortrait = (): string => {
  const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
  return `default:${DEFAULT_AVATARS[randomIndex].id}`;
};

/**
 * Convert image to base64 for upload
 */
const imageToBase64 = async (uri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }
};

/**
 * Upload avatar image to Supabase Storage
 */
export const uploadAvatar = async (
  imageUri: string, 
  userId: string, 
  characterId?: string
): Promise<AvatarUploadResult> => {
  try {
    // Generate unique filename with user ID as folder
    const timestamp = Date.now();
    const fileName = characterId 
      ? `${userId}/character_${characterId}_${timestamp}.jpg`
      : `${userId}/avatar_${timestamp}.jpg`;
    
    // Convert image to base64
    const base64Data = await imageToBase64(imageUri);
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, bytes, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };

  } catch (error) {
    console.error('Avatar upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

/**
 * Delete avatar from Supabase Storage
 */
export const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
  try {
    // Only delete if it's a Supabase storage URL (not a default avatar)
    if (!avatarUrl.includes('supabase') || isDefaultAvatar(avatarUrl)) {
      return true; // Don't try to delete external URLs or default avatars
    }

    // Extract filename from URL
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName) {
      return true;
    }

    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Avatar delete error:', error);
    return false;
  }
};

/**
 * Pick and upload avatar image
 */
export const pickAndUploadAvatar = async (
  userId: string,
  characterId?: string,
  onProgress?: (progress: string) => void
): Promise<AvatarUploadResult> => {
  try {
    onProgress?.('Selecting image...');

    if (Platform.OS === 'web') {
      // For web, offer predefined options
      return { 
        success: true, 
        url: getRandomFantasyPortrait() 
      };
    }

    // Request permissions for mobile
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return { 
        success: false, 
        error: 'Camera roll permissions are required to select an avatar.' 
      };
    }

    onProgress?.('Opening image picker...');

    // Launch image picker with modified options
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return { success: false, error: 'Image selection cancelled' };
    }

    onProgress?.('Processing image...');

    // Use base64 data directly if available
    if (result.assets[0].base64) {
      // Create file path with user ID as folder
      const timestamp = Date.now();
      const fileName = characterId 
        ? `${userId}/character_${characterId}_${timestamp}.jpg`
        : `${userId}/avatar_${timestamp}.jpg`;
      
      // Convert base64 to Uint8Array
      const binaryString = atob(result.assets[0].base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      onProgress?.('Uploading to storage...');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, bytes, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return { 
        success: true, 
        url: urlData.publicUrl 
      };
    }

    // Fallback to URI if base64 is not available
    return await uploadAvatar(result.assets[0].uri, userId, characterId);

  } catch (error) {
    console.error('Pick and upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to pick and upload image' 
    };
  }
};

/**
 * Get character avatar URL with fallback
 */
export const getCharacterAvatarUrl = (character: any): any => {
  // Try to get avatar from character_data
  const avatarUrl = character?.character_data?.avatar || character?.avatar;
  
  if (avatarUrl && typeof avatarUrl === 'string') {
    // Check if it's a default avatar reference
    if (avatarUrl.startsWith('default:')) {
      const avatarId = avatarUrl.replace('default:', '');
      const defaultAvatar = getAvatarById(avatarId);
      return defaultAvatar ? defaultAvatar.imagePath : getDefaultAvatar();
    }
    
    // Return URL as-is for uploaded images
    return { uri: avatarUrl };
  }
  
  // Fallback to random default
  const fallbackId = getDefaultAvatar().replace('default:', '');
  const fallbackAvatar = getAvatarById(fallbackId);
  return fallbackAvatar ? fallbackAvatar.imagePath : DEFAULT_AVATARS[0].imagePath;
};

/**
 * Update character avatar in database
 */
export const updateCharacterAvatar = async (
  characterId: string,
  avatarUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('characters')
      .update({ 
        character_data: supabase.rpc('jsonb_set', {
          target: 'character_data',
          path: '{avatar}',
          new_value: JSON.stringify(avatarUrl)
        })
      })
      .eq('id', characterId);

    if (error) {
      console.error('Update character avatar error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update character avatar error:', error);
    return false;
  }
};

/**
 * Check if avatar URL is a default avatar
 */
export const isDefaultAvatar = (avatarUrl: string): boolean => {
  // Check if it's a default avatar reference
  return avatarUrl.startsWith('default:') || avatarUrl.includes('pexels.com');
};

/**
 * Check if avatar URL is a custom uploaded avatar
 */
export const isCustomAvatar = (avatarUrl: string): boolean => {
  return avatarUrl.includes('supabase') && !isDefaultAvatar(avatarUrl);
};