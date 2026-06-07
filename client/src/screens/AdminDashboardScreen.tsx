import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

const PERIODS: Array<{ label: string; value: LeaderboardPeriod }> = [
  { label: 'Today', value: 'daily' },
  { label: 'Month', value: 'monthly' },
  { label: 'Year', value: 'yearly' },
  { label: 'All Time', value: 'all_time' },
];

const SORTS: Array<{ label: string; value: LeaderboardSortKey }> = [
  { label: '📏 Distance', value: 'distanceMeters' },
  { label: '🚴 Rides', value: 'completedRides' },
  { label: '⭐ Saved', value: 'savedRoutesCount' },
  { label: '📋 Published', value: 'publishedRoutesCount' },
  { label: '★ Rating', value: 'averageRating' },
  { label: '🔤 Name', value: 'name' },
];

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statCardTop} />
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LeaderboardRow({
  user,
  index,
}: {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
    distanceMeters: number;
    completedRides: number;
    savedRoutesCount: number;
    publishedRoutesCount: number;
    averageRating: number;
  };
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 2, useNativeDriver: true, delay: index * 60 } as any),
    ]).start();
  }, [index, opacity, translateY]);

  const rankColors = index === 0 ? ['#f59e0b', '#d97706'] : index === 1 ? ['#94a3b8', '#64748b'] : index === 2 ? ['#cd7c3a', '#a05c2a'] : Gradients.primary;

  return (
    <Animated.View style={[styles.rowCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.rowHeader}>
        <LinearGradient colors={rankColors as any} style={styles.rankCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </LinearGradient>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{user.name}</Text>
          <Text style={styles.rowEmail}>{user.email}</Text>
        </View>
        <View style={[styles.roleBadge, user.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
          <Text style={styles.roleBadgeText}>{user.role === 'admin' ? '👑 Admin' : '🚴 User'}</Text>
        </View>
      </View>
      <View style={styles.rowStats}>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatValue}>{formatKm(user.distanceMeters)}</Text>
          <Text style={styles.rowStatLabel}>Distance</Text>
        </View>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatValue}>{user.completedRides}</Text>
          <Text style={styles.rowStatLabel}>Rides</Text>
        </View>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatValue}>{user.savedRoutesCount}</Text>
          <Text style={styles.rowStatLabel}>Saved</Text>
        </View>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatValue}>{user.publishedRoutesCount}</Text>
          <Text style={styles.rowStatLabel}>Published</Text>
        </View>
        <View style={styles.rowStat}>
          <Text style={styles.rowStatValue}>{user.averageRating.toFixed(1)}</Text>
          <Text style={styles.rowStatLabel}>Avg ★</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function AdminDashboardScreen({ navigation }: any) {
  const { users, currentUserId, refreshUsers } = useAuth();
  const { reports, overrides } = useSchoolZoneReports();
  const comments = useLocationComments((s) => s.comments);
  const currentUser = users.find((u) => u.id === currentUserId);
  const schoolZones = useMemo(() => getSchoolZoneFeatures(overrides), [overrides]);
  const counters = getHiddenCounters(users, schoolZones, comments);
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const { rows, period, sortKey, loading, error, setPeriod, setSortKey, load } = useAdminLeaderboard();

  useEffect(() => { void refreshUsers(); }, [refreshUsers]);
  useEffect(() => {
    if (currentUser?.role === 'admin') void load();
  }, [currentUser?.role, load, period]);

  if (currentUser?.role !== 'admin') {
    return (
      <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.title}>Admin Only</Text>
          <Text style={styles.muted}>Only admins can view the dashboard.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard value={counters.schoolZones} label="School Zones" icon="🏫" />
          <StatCard value={counters.users} label="Users" icon="👥" />
          <StatCard value={counters.admins} label="Admins" icon="👑" />
          <StatCard value={pendingReports.length} label="Pending Reports" icon="📋" />
        </View>

        {/* Review button */}
        <TouchableOpacity onPress={() => navigation.navigate('ReviewReports')}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reviewButton}
          >
            <Text style={styles.reviewButtonText}>Review School Zone Reports →</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Cyclist Leaderboard</Text>

        {/* Period selector */}
        <View style={styles.segmentRow}>
          {PERIODS.map((item) =>
            period === item.value ? (
              <LinearGradient key={item.value} colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.segmentActive}>
                <TouchableOpacity onPress={() => setPeriod(item.value)}>
                  <Text style={styles.segmentTextActive}>{item.label}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity key={item.value} style={styles.segment} onPress={() => setPeriod(item.value)}>
                <Text style={styles.segmentText}>{item.label}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Sort selector */}
        <View style={styles.segmentRow}>
          {SORTS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.sortChip, sortKey === item.value && styles.sortChipActive]}
              onPress={() => setSortKey(item.value)}
            >
              <Text style={[styles.sortChipText, sortKey === item.value && styles.sortChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? <Text style={styles.muted}>Loading leaderboard…</Text> : null}

        {rows.map((user, index) => (
          <LeaderboardRow key={user.userId} user={user} index={index} />
        ))}

        {/* School zones */}
        <Text style={styles.sectionTitle}>Current School Zones</Text>
        {schoolZones.map((zone, index) => (
          <View key={String(zone.id)} style={styles.zoneCard}>
            <Text style={styles.zoneName}>{zone.properties.name || `School zone ${index + 1}`}</Text>
            <Text style={styles.zoneId}>ID: {String(zone.id)}</Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: Spacing.xl, paddingBottom: Spacing.huge },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  lockIcon: { fontSize: 48, marginBottom: Spacing.md },
  title:    { ...Typography.h2, marginBottom: Spacing.sm },
  muted:    { ...Typography.muted, textAlign: 'center' },
  errorText:{ color: Colors.error, marginBottom: Spacing.md, fontWeight: '700' },

  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md, marginTop: Spacing.xs },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: {
    width: '47%',
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    ...Shadows.sm,
  },
  statCardTop: { width: '100%', height: 4, marginBottom: Spacing.md },
  statIcon:    { fontSize: 24, marginBottom: Spacing.xs },
  statValue:   { ...Typography.h2, color: Colors.primary },
  statLabel:   { ...Typography.caption },

  reviewButton: { borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.xl, ...Shadows.md },
  reviewButtonText: { color: Colors.white, fontWeight: '800', fontSize: 15 },

  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  segment:    { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  segmentActive: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  segmentText:       { ...Typography.bodyBold, color: Colors.mutedText },
  segmentTextActive: { ...Typography.bodyBold, color: Colors.white },

  sortChip:         { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  sortChipActive:   { backgroundColor: 'rgba(255,133,82,0.2)', borderColor: 'rgba(255,133,82,0.4)' },
  sortChipText:     { fontSize: 11, fontWeight: '600', color: Colors.mutedText },
  sortChipTextActive: { color: Colors.accent },

  rowCard: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  rowHeader:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  rankCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  rankText:   { color: Colors.white, fontWeight: '800', fontSize: 13 },
  rowInfo:    { flex: 1 },
  rowName:    { ...Typography.bodyBold, color: Colors.white },
  rowEmail:   { ...Typography.caption },

  roleBadge:  { borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  adminBadge: { backgroundColor: 'rgba(249,16,102,0.2)', borderWidth: 1, borderColor: 'rgba(249,16,102,0.3)' },
  userBadge:  { backgroundColor: 'rgba(139,143,163,0.15)', borderWidth: 1, borderColor: 'rgba(139,143,163,0.2)' },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  rowStats:     { flexDirection: 'row', justifyContent: 'space-between' },
  rowStat:      { alignItems: 'center' },
  rowStatValue: { ...Typography.bodyBold, color: Colors.primary, fontSize: 13 },
  rowStatLabel: { ...Typography.label, fontSize: 10 },

  zoneCard: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  zoneName: { ...Typography.bodyBold, color: Colors.white },
  zoneId:   { ...Typography.caption, marginTop: 2 },
});
