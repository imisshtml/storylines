import React from 'react';
import InviteFriendsScreen from '../src/screens/InviteFriendsScreen';
import { Stack } from 'expo-router';

export default function InviteTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <InviteFriendsScreen />
    </>
  );
}