import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SavedRoutesScreen from './src/screens/SavedRoutesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{ title: 'Pedal Anatolia' }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Preferences' }} 
        />
        <Stack.Screen 
          name="SavedRoutes" 
          component={SavedRoutesScreen} 
          options={{ title: 'Saved Routes' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
