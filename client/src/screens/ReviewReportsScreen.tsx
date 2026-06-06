import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useSchoolZoneReports, SchoolZoneReport } from '../store/schoolZoneReports';
import { useAuth } from '../store/auth';

function ReportCard({
  report,
  onApprove,
  onReject,
}: {
  report: SchoolZoneReport;
  onApprove: () => void;
  onReject: () => void;
}) {
  const label = report.type === 'add' ? 'Add school' : 'Remove zone';
  const where =
    report.type === 'add'
      ? `at ${report.lat?.toFixed(4)}, ${report.lon?.toFixed(4)}`
      : `zone ${report.zoneId}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.detail}>{where}</Text>
      <Text>{report.note}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.approve} onPress={onApprove}>
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reject} onPress={onReject}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReviewReportsScreen() {
  const { reports, load, approveReport, rejectReport } = useSchoolZoneReports();
  const { users, currentUserId } = useAuth();
  const currentUser = users.find((u) => u.id === currentUserId);

  useEffect(() => {
    load();
  }, [load]);

  const pending = reports.filter((r) => r.status === 'pending');

  if (currentUser?.role !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.header}>Admin only</Text>
        <Text style={styles.empty}>Only admins can review school zone reports.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Pending reports</Text>
      {pending.length === 0 ? (
        <Text style={styles.empty}>Nothing to review.</Text>
      ) : (
        pending.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            onApprove={async () => {
              try {
                await approveReport(r.id);
                Alert.alert('Done', r.type === 'add' ? 'Zone added on map.' : 'Zone removed from map.');
              } catch (error) {
                Alert.alert(
                  'Could not approve report',
                  error instanceof Error ? error.message : 'Please try again.'
                );
              }
            }}
            onReject={async () => {
              try {
                await rejectReport(r.id);
                Alert.alert('Done', 'Report rejected.');
              } catch (error) {
                Alert.alert(
                  'Could not reject report',
                  error instanceof Error ? error.message : 'Please try again.'
                );
              }
            }}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  empty: { color: '#888' },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '600' },
  detail: { color: '#555', marginVertical: 6 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approve: { flex: 1, backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center' },
  reject: { flex: 1, backgroundColor: '#c62828', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
