import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { usePreferences } from '../store/preferences';

export default function SettingsScreen() {
  const { avoidSchoolZonesDuringPeakHours, setAvoidSchoolZones } = usePreferences();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Route Preferences</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Avoid School Zones During Peak Hours</Text>
        <Switch
          value={avoidSchoolZonesDuringPeakHours}
          onValueChange={setAvoidSchoolZones}
        />
      </View>
      <Text style={styles.description}>
        When enabled, routes will attempt to avoid school and university zones during typical traffic peak hours.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingText: {
    fontSize: 16,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  }
});
