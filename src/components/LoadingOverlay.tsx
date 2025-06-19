import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

/**
 * A reusable loading overlay component that can be used throughout the app
 * to indicate loading states with an optional message.
 */
export default function LoadingOverlay({ 
  visible, 
  message = 'Loading...', 
  transparent = true 
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="fade"
    >
      <View style={[
        styles.container,
        transparent ? styles.transparentBackground : styles.solidBackground
      ]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#4CAF50" />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  solidBackground: {
    backgroundColor: '#121212',
  },
  loadingBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
    textAlign: 'center',
  },
});