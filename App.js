import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { LightTheme, DarkTheme } from './src/utils/theme';
import { ProProvider } from './src/contexts/ProContext';
import {
  requestNotificationPermissions,
  setupNotificationChannel,
} from './src/utils/notifications';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  useEffect(() => {
    setupNotificationChannel();
    requestNotificationPermissions();
  }, []);

  return (
    <ProProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <AppNavigator />
      </NavigationContainer>
    </ProProvider>
  );
}
