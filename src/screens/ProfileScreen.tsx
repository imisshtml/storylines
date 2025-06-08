import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ImageBackground, TextInput, ActivityIndicator } from 'react-native';
import { useAtom } from 'jotai';

export default function ProfileScreen() {

  return (
    <View style={styles.container}>
      <Text>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});