import { router } from 'expo-router';
import React from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useAtom } from 'jotai';

export default function SettingsScreen() {
  const handleBack = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <View style={styles.backButton}>
            <TouchableOpacity onPress={handleBack} style={styles.touchable} />
            <ArrowLeft color="#fff" size={24} />
          </View>
        <Text style={styles.title}>Settings</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#121212',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 16,
  },
  touchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});