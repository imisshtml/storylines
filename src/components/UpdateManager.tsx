import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { Download, RefreshCw, AlertCircle } from 'lucide-react-native';

interface UpdateManagerProps {
  children: React.ReactNode;
}

interface UpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  showUpdateModal: boolean;
  error: string | null;
  progress: number;
}

export default function UpdateManager({ children }: UpdateManagerProps) {
  const [updateState, setUpdateState] = useState<UpdateState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
    showUpdateModal: false,
    error: null,
    progress: 0,
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
        console.log('Update available, showing modal');
        setUpdateState(prev => ({
          ...prev,
          isChecking: false,
          isUpdateAvailable: true,
          showUpdateModal: true,
        }));
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

  const downloadAndInstallUpdate = async () => {
    try {
      setUpdateState(prev => ({
        ...prev,
        isDownloading: true,
        showUpdateModal: true,
        error: null,
        progress: 0,
      }));

      // Download the update
      const downloadResult = await Updates.fetchUpdateAsync();
      
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
        }, 1000);
      } else {
        console.log('No new update to download');
        setUpdateState(prev => ({
          ...prev,
          isDownloading: false,
          showUpdateModal: false,
        }));
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateState(prev => ({
        ...prev,
        isDownloading: false,
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
                    onPress={downloadAndInstallUpdate}
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
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginTop: 16,
  },
}); 