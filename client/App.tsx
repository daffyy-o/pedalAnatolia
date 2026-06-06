import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SavedRoutesScreen from './src/screens/SavedRoutesScreen';
import ReportSchoolZoneScreen from './src/screens/ReportSchoolZoneScreen';
import ReviewReportsScreen from './src/screens/ReviewReportsScreen';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import { useSchoolZoneReports } from './src/store/schoolZoneReports';
import { useAuth } from './src/store/auth';
import { useSavedRoutes } from './src/store/savedRoutes';
import RouteBoardScreen from './src/screens/RouteBoardScreen';
import RouteDetailScreen from './src/screens/RouteDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const initializeAuth = useAuth((state) => state.initialize);
  const initialized = useAuth((state) => state.initialized);
  const currentUserId = useAuth((state) => state.currentUserId);
  const loadReports = useSchoolZoneReports((s) => s.load);
  const startRemoteSync = useSchoolZoneReports((s) => s.startRemoteSync);
  const loadSavedRoutes = useSavedRoutes((state) => state.loadRoutes);

  useEffect(() => {
    return initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!currentUserId) return;
    void loadReports();
    void loadSavedRoutes();
    return startRemoteSync();
  }, [currentUserId, loadReports, loadSavedRoutes, startRemoteSync]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {currentUserId ? (
          <>
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
              name="RouteBoard"
              component={RouteBoardScreen}
              options={{ title: 'Route Board' }}
            />
            <Stack.Screen
              name="RouteDetail"
              component={RouteDetailScreen}
              options={{ title: 'Route Details' }}
            />
            <Stack.Screen
              name="ReportSchoolZone"
              component={ReportSchoolZoneScreen}
              options={{ title: 'Report on map' }}
            />
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{ title: 'Admin dashboard' }}
            />
            <Stack.Screen
              name="ReviewReports"
              component={ReviewReportsScreen}
              options={{ title: 'Review reports' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Login', headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef4f8',
  },
});
