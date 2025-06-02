import { Stack } from 'expo-router';

export default function StoryStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="character" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}