import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator as RNActivityIndicator, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface ActivityIndicatorProps {
  /**
   * Whether to show the activity indicator
   */
  isLoading: boolean;
  
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  
  /**
   * Whether to show the indicator in a full-screen overlay
   */
  fullScreen?: boolean;
  
  /**
   * Optional style to apply to the container
   */
  style?: ViewStyle;
  
  /**
   * Size of the activity indicator
   */
  size?: 'small' | 'large';
  
  /**
   * Color of the activity indicator
   */
  color?: string;
  
  /**
   * Whether to show a transparent background
   */
  transparent?: boolean;
  
  /**
   * Children to render when not loading
   */
  children?: React.ReactNode;
}

/**
 * A reusable activity indicator component that can be used in various contexts:
 * - As a full-screen overlay (uses Lottie animation)
 * - As an inline component (uses React Native ActivityIndicator)
 * - As a wrapper around content that shows a loading state
 */
export default function ActivityIndicator({
  isLoading,
  text,
  fullScreen = false,
  style,
  size = 'large',
  color = '#4CAF50',
  transparent = false,
  children
}: ActivityIndicatorProps) {
  if (!isLoading && children) {
    return <>{children}</>;
  }
  
  if (!isLoading) {
    return null;
  }

  return (
    <View 
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        transparent && styles.transparent,
        style
      ]}
    >
      <View style={[styles.content, fullScreen && styles.fullScreenContent]}>
        {fullScreen ? (
          <LottieView
            source={require('../../assets/lottie/campfire.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
            resizeMode='contain'
          />
        ) : (
          <RNActivityIndicator size={size} color={color} />
        )}
        {text && <Text style={[styles.text, fullScreen && styles.fullScreenText]}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    minWidth: 120,
    minHeight: 120,
  },
  fullScreenContent: {
    backgroundColor: 'transparent',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  fullScreenText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 24,
    color: '#fff',
    textAlign: 'center',
  },
  lottieAnimation: {
    width: 100,
    height: 150,
  },
});