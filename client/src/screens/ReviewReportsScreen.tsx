import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Alert } from '../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { useSchoolZoneReports, SchoolZoneReport } from '../store/schoolZoneReports';
import { useAuth } from '../store/auth';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

function ReportCard({
  report,
  onApprove,
  onReject,
}: {
  report: SchoolZoneReport;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isAdd = report.type === 'add';
  const where = isAdd
    ? `${report.lat?.toFixed(4)}, ${report.lon?.toFixed(4)}`
    : `Zone ID: ${report.zoneId}`;

  return (
    <View style={styles.card}>
      {/* Type badge */}
      <View style={[styles.typeBadge, isAdd ? styles.typeBadgeAdd : styles.typeBadgeRemove]}>
        <Text style={[styles.typeBadgeText, isAdd ? styles.typeBadgeTextAdd : styles.typeBadgeTextRemove]}>
          {isAdd ? '➕ Add School' : '🗑️ Remove Zone'}
        </Text>
      </View>

      <Text style={styles.whereText}>{where}</Text>
      <Text style={styles.noteText}>{report.note}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
          <LinearGradient colors={['#22c55e', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
            <Text style={styles.btnText}>✓ Approve</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
          <Text style={styles.rejectBtnText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReviewReportsScreen() {
  const { reports, load, approveReport, rejectReport } = useSchoolZoneReports();
  const { users, currentUserId } = useAuth();
  const currentUser = users.find((u) => u.id === currentUserId);

  useEffect(() => { load(); }, [load]);

  const pending = reports.filter((r) => r.status === 'pending');

  if (currentUser?.role !== 'admin') {
    return (
      <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.bigTitle}>Admin Only</Text>
          <Text style={styles.muted}>Only admins can review school zone reports.</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {pending.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.bigTitle}>All caught up!</Text>
            <Text style={styles.muted}>No pending reports to review.</Text>
          </View>
        ) : (
          pending.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onApprove={async () => {
                try {
                  await approveReport(r.id);
                  Alert.alert('Done', r.type === 'add' ? 'Zone added.' : 'Zone removed.');
                } catch (error) {
                  Alert.alert('Could not approve', error instanceof Error ? error.message : 'Please try again.');
                }
              }}
              onReject={async () => {
                try {
                  await rejectReport(r.id);
                  Alert.alert('Done', 'Report rejected.');
                } catch (error) {
                  Alert.alert('Could not reject', error instanceof Error ? error.message : 'Please try again.');
                }
              }}
            />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: Spacing.xl, paddingBottom: Spacing.huge },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  lockIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyIcon:{ fontSize: 48, marginBottom: Spacing.md },
  bigTitle: { ...Typography.h2, marginBottom: Spacing.sm },
  muted:    { ...Typography.muted, textAlign: 'center' },

  card: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  typeBadgeAdd:         { backgroundColor: 'rgba(255,133,82,0.15)', borderColor: 'rgba(255,133,82,0.4)' },
  typeBadgeRemove:      { backgroundColor: 'rgba(139,143,163,0.15)', borderColor: 'rgba(139,143,163,0.3)' },
  typeBadgeText:        { fontSize: 12, fontWeight: '700' },
  typeBadgeTextAdd:     { color: Colors.accent },
  typeBadgeTextRemove:  { color: Colors.mutedText },

  whereText: { ...Typography.bodyBold, color: Colors.mutedText, marginBottom: Spacing.sm },
  noteText:  { ...Typography.body, color: Colors.white, marginBottom: Spacing.lg },

  buttonRow:   { flexDirection: 'row', gap: Spacing.sm },
  approveBtn:  { flex: 1, borderRadius: BorderRadius.sm, overflow: 'hidden' },
  btnGradient: { paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  btnText:     { color: Colors.white, fontWeight: '700', fontSize: 14 },

  rejectBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: BorderRadius.sm,
  },
  rejectBtnText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
});
