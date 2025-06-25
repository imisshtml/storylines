import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import * as Updates from 'expo-updates';
import { Download, RefreshCw, AlertCircle } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

interface UpdateManagerProps {
  children: React.ReactNode;
}

interface UpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  showUpdateModal: boolean;
  showAutoUpdate: boolean;
  error: string | null;
  progress: number;
  autoUpdateEnabled: boolean;
}

export default function UpdateManager({ children }: UpdateManagerProps) {
  const [updateState, setUpdateState] = useState<UpdateState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
    showUpdateModal: false,
    showAutoUpdate: false,
    error: null,
    progress: 0,
    autoUpdateEnabled: true, // Enable automatic updates by default - can be made configurable
  });

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    // Only check for updates in production builds
    if (__DEV__ || !Updates.isEnabled) {
      console.log('Updates disabled in development or not enabled');
      return;
    }

    try {
      setUpdateState(prev => ({ ...prev, isChecking: true, error: null }));
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('Update available');
        
        if (updateState.autoUpdateEnabled) {
          // Automatically download and install the update
          console.log('Auto-updating enabled, starting automatic download');
          setUpdateState(prev => ({
            ...prev,
            isChecking: false,
            isUpdateAvailable: true,
            showAutoUpdate: true,
          }));
          
          // Start automatic download after showing the update UI
          setTimeout(() => {
            downloadAndInstallUpdate(true);
          }, 500);
        } else {
          // Show manual update modal
          console.log('Auto-updating disabled, showing manual update modal');
          setUpdateState(prev => ({
            ...prev,
            isChecking: false,
            isUpdateAvailable: true,
            showUpdateModal: true,
          }));
        }
      } else {
        console.log('No updates available');
        setUpdateState(prev => ({ ...prev, isChecking: false }));
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateState(prev => ({
        ...prev,
        isChecking: false,
        error: 'Failed to check for updates',
      }));
    }
  };

  const downloadAndInstallUpdate = async (isAutomatic: boolean = false) => {
    try {
      setUpdateState(prev => ({
        ...prev,
        isDownloading: true,
        showUpdateModal: !isAutomatic,
        showAutoUpdate: isAutomatic,
        error: null,
        progress: 0,
      }));

      // Simulate progress for better UX (since fetchUpdateAsync doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUpdateState(prev => {
          if (prev.progress < 90) {
            return { ...prev, progress: prev.progress + Math.random() * 15 };
          }
          return prev;
        });
      }, 200);

      // Download the update
      const downloadResult = await Updates.fetchUpdateAsync();
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      if (downloadResult.isNew) {
        console.log('Update downloaded successfully, reloading app');
        setUpdateState(prev => ({
          ...prev,
          isDownloading: false,
          isUpdatePending: true,
          progress: 100,
        }));
        
        // Wait a moment to show completion, then reload
        setTimeout(() => {
          Updates.reloadAsync();
        }, isAutomatic ? 1500 : 1000);
      } else {
        console.log('No new update to download');
        setUpdateState(prev => ({
          ...prev,
          isDownloading: false,
          showUpdateModal: false,
          showAutoUpdate: false,
        }));
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateState(prev => ({
        ...prev,
        isDownloading: false,
        showAutoUpdate: false,
        error: 'Failed to download update',
      }));
    }
  };

  const dismissUpdate = () => {
    setUpdateState(prev => ({
      ...prev,
      showUpdateModal: false,
      isUpdateAvailable: false,
    }));
  };

  const retryUpdate = () => {
    if (updateState.error) {
      checkForUpdates();
    } else {
      downloadAndInstallUpdate();
    }
  };

  return (
    <>
      {children}
      
      {/* Automatic Update Overlay */}
      {updateState.showAutoUpdate && (
        <View style={styles.autoUpdateOverlay}>
          <View style={styles.autoUpdateContent}>
            <LottieView
              source={require('../../assets/lottie/campfire.json')}
              autoPlay
              loop
              style={styles.updateLottieAnimation}
              resizeMode='contain'
            />
            <Text style={styles.updateText}>New stories being told...</Text>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { width: `${updateState.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {updateState.progress > 0 ? `${Math.round(updateState.progress)}%` : 'Preparing...'}
            </Text>
          </View>
        </View>
      )}
      
      {/* Update Modal */}
      <Modal
        visible={updateState.showUpdateModal}
        transparent
        animationType="fade"
        onRequestClose={dismissUpdate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {updateState.error ? (
              // Error State
              <>
                <AlertCircle size={48} color="#f44336" style={styles.icon} />
                <Text style={styles.title}>Update Failed</Text>
                <Text style={styles.message}>{updateState.error}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={dismissUpdate}
                  >
                    <Text style={styles.secondaryButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={retryUpdate}
                  >
                    <RefreshCw size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : updateState.isUpdatePending ? (
              // Update Complete State
              <>
                <Download size={48} color="#4CAF50" style={styles.icon} />
                <Text style={styles.title}>Update Complete!</Text>
                <Text style={styles.message}>
                  The app will restart to apply the update...
                </Text>
                <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
              </>
            ) : updateState.isDownloading ? (
              // Downloading State
              <>
                <Download size={48} color="#2196F3" style={styles.icon} />
                <Text style={styles.title}>Downloading Update</Text>
                <Text style={styles.message}>
                  Please wait while we download the latest version...
                </Text>
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.progressText}>
                    {updateState.progress > 0 ? `${updateState.progress}%` : 'Downloading...'}
                  </Text>
                </View>
              </>
            ) : (
              // Update Available State
              <>
                <Download size={48} color="#4CAF50" style={styles.icon} />
                <Text style={styles.title}>Update Available</Text>
                <Text style={styles.message}>
                  A new version of Storylines is available with improvements and bug fixes.
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={dismissUpdate}
                  >
                    <Text style={styles.secondaryButtonText}>Later</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => downloadAndInstallUpdate(false)}
                  >
                    <Download size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>Update Now</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontWeight: '500',
    textAlign: 'center',
  },
  loader: {
    marginTop: 16,
  },
  autoUpdateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoUpdateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  progressBar: {
    width: '100%',
    maxWidth: 280,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  updateLottieAnimation: {
    width: 120,
    height: 180,
  },
  updateText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 24,
    color: '#fff',
    textAlign: 'center',
  },
}); 