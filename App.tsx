import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';

import HomeScreen from './src/screens/HomeScreen';
import CreateCampaignScreen from './src/screens/CreateCampaignScreen';
import InviteFriendsScreen from './src/screens/InviteFriendsScreen';
import AccountScreen from './src/screens/AccountScreen';
import StoryViewScreen from './src/screens/StoryViewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
          <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
          <Stack.Screen 
            name="StoryView" 
            component={StoryViewScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}