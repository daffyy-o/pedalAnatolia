import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
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
import { useLocationComments } from './src/store/locationComments';
import RouteBoardScreen from './src/screens/RouteBoardScreen';
import RouteDetailScreen from './src/screens/RouteDetailScreen';
import { Colors } from './src/lib/theme';
import { CustomAlert } from './src/components/CustomAlert';

const Stack = createNativeStackNavigator();

// Custom dark navigation theme extending React Navigation's DarkTheme
const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:    Colors.primary,
    background: Colors.navy,
    card:       Colors.darkSurface,
    text:       Colors.white,
    border:     'rgba(255,255,255,0.08)',
    notification: Colors.primary,
  },
};

// Shared header style for all screens
const sharedHeaderStyle = {
  headerStyle:            { backgroundColor: Colors.darkSurface },
  headerTintColor:        Colors.white,
  headerTitleStyle:       { fontWeight: '700' as const, color: Colors.white },
  headerShadowVisible:    false,
  contentStyle:           { backgroundColor: Colors.navy },
  animation:              'slide_from_right' as const,
};

export default function App() {
  const initializeAuth = useAuth((state) => state.initialize);
  const initialized = useAuth((state) => state.initialized);
  const currentUserId = useAuth((state) => state.currentUserId);
  const loadReports = useSchoolZoneReports((s) => s.load);
  const startRemoteSync = useSchoolZoneReports((s) => s.startRemoteSync);
  const loadSavedRoutes = useSavedRoutes((state) => state.loadRoutes);
  const loadComments = useLocationComments((state) => state.loadComments);

  useEffect(() => {
    return initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!currentUserId) return;
    void loadReports();
    void loadSavedRoutes();
    void loadComments();
    return startRemoteSync();
  }, [currentUserId, loadReports, loadSavedRoutes, loadComments, startRemoteSync]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingBrand}>🚴</Text>
        <Text style={styles.loadingText}>PEDAL ANATOLIA</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer theme={NavTheme}>
        <Stack.Navigator>
          {currentUserId ? (
            <>
              <Stack.Screen
                name="Map"
                component={MapScreen}
                options={{ ...sharedHeaderStyle, headerShown: false }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ ...sharedHeaderStyle, title: 'Preferences' }}
              />
              <Stack.Screen
                name="SavedRoutes"
                component={SavedRoutesScreen}
                options={{ ...sharedHeaderStyle, title: 'Saved Routes' }}
              />
              <Stack.Screen
                name="RouteBoard"
                component={RouteBoardScreen}
                options={{ ...sharedHeaderStyle, title: 'Route Board' }}
              />
              <Stack.Screen
                name="RouteDetail"
                component={RouteDetailScreen}
                options={{ ...sharedHeaderStyle, title: 'Route Details' }}
              />
              <Stack.Screen
                name="ReportSchoolZone"
                component={ReportSchoolZoneScreen}
                options={{ ...sharedHeaderStyle, title: 'Report School Zone' }}
              />
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ ...sharedHeaderStyle, title: 'Admin Dashboard' }}
              />
              <Stack.Screen
                name="ReviewReports"
                component={ReviewReportsScreen}
                options={{ ...sharedHeaderStyle, title: 'Review Reports' }}
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
      <CustomAlert />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navy,
    gap: 8,
  },
  loadingBrand: { fontSize: 48 },
  loadingText:  { fontSize: 18, fontWeight: '900', color: Colors.white, letterSpacing: 3 },
  spinner:      { marginTop: 24 },
});
