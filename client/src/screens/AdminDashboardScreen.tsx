import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getSchoolZoneFeatures } from '../lib/schoolZones';
import { useLocationComments } from '../store/locationComments';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { currentMonthKey, formatKm, useUsers } from '../store/users';
import { getHiddenCounters } from '../lib/stats';

export default function AdminDashboardScreen({ navigation }: any) {
  const { users, currentUserId } = useUsers();
  const { reports, overrides } = useSchoolZoneReports();
  const comments = useLocationComments((s) => s.comments);
  const currentUser = users.find((u) => u.id === currentUserId);
  const schoolZones = useMemo(() => getSchoolZoneFeatures(overrides), [overrides]);
  const counters = getHiddenCounters(users, schoolZones, comments);
  const month = currentMonthKey();
  const pendingReports = reports.filter((report) => report.status === 'pending');

  if (currentUser?.role !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Admin only</Text>
        <Text style={styles.muted}>Only admins can view the dashboard.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{counters.schoolZones}</Text>
          <Text style={styles.statLabel}>School zones</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{counters.users}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{counters.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{pendingReports.length}</Text>
          <Text style={styles.statLabel}>Pending reports</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.reviewButton} onPress={() => navigation.navigate('ReviewReports')}>
        <Text style={styles.reviewButtonText}>Review school zone reports</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>All users</Text>
      {users.map((user) => (
        <View key={user.id} style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{user.name}</Text>
            <Text style={[styles.roleBadge, user.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
              {user.role}
            </Text>
          </View>
          <Text style={styles.detail}>Age: {user.age}</Text>
          <Text style={styles.detail}>Email: {user.email}</Text>
          <Text style={styles.detail}>This month: {formatKm(user.monthlyDistanceMeters[month] || 0)}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Current school zones</Text>
      {schoolZones.map((zone, index) => (
        <View key={String(zone.id)} style={styles.zoneRow}>
          <Text style={styles.zoneName}>{zone.properties.name || `School zone ${index + 1}`}</Text>
          <Text style={styles.zoneId}>ID: {String(zone.id)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f8' },
  content: { padding: 16 },
  centered: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  muted: { color: '#666', textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20' },
  statLabel: { color: '#555', marginTop: 4 },
  reviewButton: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 13, alignItems: 'center', marginBottom: 18 },
  reviewButtonText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 8, marginBottom: 10 },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden', fontWeight: '700' },
  adminBadge: { backgroundColor: '#e3f2fd', color: '#1565c0' },
  userBadge: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
  detail: { color: '#555', marginTop: 2 },
  zoneRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  zoneName: { fontWeight: '700', color: '#222' },
  zoneId: { color: '#666', fontSize: 12, marginTop: 3 },
});

