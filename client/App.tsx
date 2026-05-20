import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SavedRoutesScreen from './src/screens/SavedRoutesScreen';
import ReportSchoolZoneScreen from './src/screens/ReportSchoolZoneScreen';
import ReviewReportsScreen from './src/screens/ReviewReportsScreen';
import { useSchoolZoneReports } from './src/store/schoolZoneReports';

const Stack = createNativeStackNavigator();

export default function App() {
  const loadReports = useSchoolZoneReports((s) => s.load);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

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
        <Stack.Screen
          name="ReportSchoolZone"
          component={ReportSchoolZoneScreen}
          options={{ title: 'Report on map' }}
        />
        <Stack.Screen
          name="ReviewReports"
          component={ReviewReportsScreen}
          options={{ title: 'Review reports' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
