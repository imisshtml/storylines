import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomSplashScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/sl_logo.jpg')} 
        style={styles.logo}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  logo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
}); 