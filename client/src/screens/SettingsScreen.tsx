import React from 'react';
import { View, Text, Switch, StyleSheet, Button } from 'react-native';
import { usePreferences } from '../store/preferences';

export default function SettingsScreen({ navigation }: any) {
  const { avoidSchoolZones, setAvoidSchoolZones } = usePreferences();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Avoid school zones</Text>
        <Switch value={avoidSchoolZones} onValueChange={setAvoidSchoolZones} />
      </View>

      <Text style={styles.section}>Reports</Text>
      <Button title="Report a school zone" onPress={() => navigation.navigate('ReportSchoolZone')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingText: { fontSize: 16, flex: 1 },
});
