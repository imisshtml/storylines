import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, CheckCircle, X, XCircle } from 'lucide-react-native';

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
  onRequestClose?: () => void;
  loading?: boolean;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  type = 'info',
  onRequestClose,
  loading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} color="#4CAF50" />;
      case 'error':
        return <XCircle size={24} color="#ff4444" />;
      case 'warning':
        return <AlertTriangle size={24} color="#FFA726" />;
      default:
        return <AlertTriangle size={24} color="#2196F3" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#ff4444';
      case 'warning':
        return '#FFA726';
      default:
        return '#2196F3';
    }
  };

  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onRequestClose) {
      onRequestClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            {getIcon()}
            <Text style={styles.title}>{title}</Text>
          </View>

          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={getIconColor()} />
            </View>
          )}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  buttons.length === 1 && styles.singleButton,
                ]}
                onPress={() => handleButtonPress(button)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook for easier usage
export const useCustomAlert = () => {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: CustomAlertButton[];
    type?: 'success' | 'error' | 'warning' | 'info';
    loading?: boolean;
  }>({
    visible: false,
    title: '',
  });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: CustomAlertButton[],
    type?: 'success' | 'error' | 'warning' | 'info',
    loading?: boolean
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type,
      loading,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alertState}
      onRequestClose={hideAlert}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
  },
  destructiveButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#ccc',
  },
  destructiveButtonText: {
    color: '#fff',
  },
}); 