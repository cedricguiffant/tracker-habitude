import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import AddEditHabitScreen from '../screens/AddEditHabitScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="AddEditHabit"
        component={AddEditHabitScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
