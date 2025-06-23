import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUp } from 'lucide-react-native';

interface LevelUpBadgeProps {
  visible: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function LevelUpBadge({ 
  visible, 
  onPress, 
  size = 'medium',
  style 
}: LevelUpBadgeProps) {
  if (!visible) return null;

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 20, height: 20 },
          icon: 12,
          text: { fontSize: 8 }
        };
      case 'large':
        return {
          container: { width: 36, height: 36 },
          icon: 20,
          text: { fontSize: 12 }
        };
      default: // medium
        return {
          container: { width: 28, height: 28 },
          icon: 16,
          text: { fontSize: 10 }
        };
    }
  };

  const sizeStyles = getBadgeSize();

  const BadgeComponent = onPress ? TouchableOpacity : View;

  return (
    <BadgeComponent
      style={[
        styles.container,
        { width: sizeStyles.container.width, height: sizeStyles.container.height },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ArrowUp size={sizeStyles.icon} color="#fff" />
    </BadgeComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9800',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  text: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
  }
});