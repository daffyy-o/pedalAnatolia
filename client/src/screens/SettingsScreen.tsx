import React, { useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Button } from 'react-native';
import { usePreferences } from '../store/preferences';
import { useSchoolZoneReports } from '../store/schoolZoneReports';

export default function SettingsScreen({ navigation }: any) {
  const { avoidSchoolZones, setAvoidSchoolZones, developerMode, setDeveloperMode } = usePreferences();
  const loadReports = useSchoolZoneReports((s) => s.load);
  const pendingCount = useSchoolZoneReports((s) => s.reports.filter((r) => r.status === 'pending').length);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingText}>Avoid school zones</Text>
        <Switch value={avoidSchoolZones} onValueChange={setAvoidSchoolZones} />
      </View>

      <Text style={styles.section}>Reports</Text>
      <Button title="Report a school zone" onPress={() => navigation.navigate('ReportSchoolZone')} />

      <View style={[styles.settingRow, { marginTop: 24 }]}>
        <Text style={styles.settingText}>Developer mode</Text>
        <Switch value={developerMode} onValueChange={setDeveloperMode} />
      </View>
      {developerMode && (
        <Button
          title={`Review reports${pendingCount ? ` (${pendingCount} pending)` : ''}`}
          onPress={() => navigation.navigate('ReviewReports')}
        />
      )}
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
