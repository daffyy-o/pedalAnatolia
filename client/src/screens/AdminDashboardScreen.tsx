import React, { useEffect, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getSchoolZoneFeatures } from '../lib/schoolZones';
import { useLocationComments } from '../store/locationComments';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { formatKm, useAuth } from '../store/auth';
import { getHiddenCounters } from '../lib/stats';
import {
  LeaderboardPeriod,
  LeaderboardSortKey,
  useAdminLeaderboard,
} from '../store/adminLeaderboard';

const PERIODS: Array<{ label: string; value: LeaderboardPeriod }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'All time', value: 'all_time' },
];

const SORTS: Array<{ label: string; value: LeaderboardSortKey }> = [
  { label: 'Distance', value: 'distanceMeters' },
  { label: 'Rides', value: 'completedRides' },
  { label: 'Saved', value: 'savedRoutesCount' },
  { label: 'Published', value: 'publishedRoutesCount' },
  { label: 'Rating', value: 'averageRating' },
  { label: 'Name', value: 'name' },
];

export default function AdminDashboardScreen({ navigation }: any) {
  const { users, currentUserId, refreshUsers } = useAuth();
  const { reports, overrides } = useSchoolZoneReports();
  const comments = useLocationComments((s) => s.comments);
  const currentUser = users.find((u) => u.id === currentUserId);
  const schoolZones = useMemo(() => getSchoolZoneFeatures(overrides), [overrides]);
  const counters = getHiddenCounters(users, schoolZones, comments);
  const pendingReports = reports.filter((report) => report.status === 'pending');
  const {
    rows,
    period,
    sortKey,
    loading,
    error,
    setPeriod,
    setSortKey,
    load,
  } = useAdminLeaderboard();

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      void load();
    }
  }, [currentUser?.role, load, period]);

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

      <Text style={styles.sectionTitle}>Cyclist leaderboard</Text>
      <View style={styles.segmentRow}>
        {PERIODS.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.segmentButton, period === item.value && styles.segmentActive]}
            onPress={() => setPeriod(item.value)}
          >
            <Text style={[styles.segmentText, period === item.value && styles.segmentTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.segmentRow}>
        {SORTS.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.sortButton, sortKey === item.value && styles.segmentActive]}
            onPress={() => setSortKey(item.value)}
          >
            <Text style={[styles.sortText, sortKey === item.value && styles.segmentTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.muted}>Loading leaderboard...</Text> : null}
      {rows.map((user, index) => (
        <View key={user.userId} style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>#{index + 1} {user.name}</Text>
            <Text style={[styles.roleBadge, user.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
              {user.role}
            </Text>
          </View>
          <Text style={styles.detail}>Email: {user.email}</Text>
          <Text style={styles.detail}>Distance: {formatKm(user.distanceMeters)}</Text>
          <Text style={styles.detail}>Completed rides: {user.completedRides}</Text>
          <Text style={styles.detail}>Saved routes: {user.savedRoutesCount}</Text>
          <Text style={styles.detail}>Published routes: {user.publishedRoutesCount}</Text>
          <Text style={styles.detail}>Average route rating: {user.averageRating.toFixed(2)}</Text>
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
  error: { color: '#c62828', marginBottom: 10, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  segmentButton: { backgroundColor: '#eee', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  sortButton: { backgroundColor: '#eee', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 7 },
  segmentActive: { backgroundColor: '#2e7d32' },
  segmentText: { color: '#333', fontWeight: '700', fontSize: 12 },
  sortText: { color: '#333', fontWeight: '700', fontSize: 11 },
  segmentTextActive: { color: '#fff' },
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

