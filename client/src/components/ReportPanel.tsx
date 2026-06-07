import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Gradients, Glass } from '../lib/theme';

export type ReportMode = 'add' | 'remove';

type Props = {
  mode: ReportMode;
  onModeChange: (mode: ReportMode) => void;
  note: string;
  onNoteChange: (text: string) => void;
  picked: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

/** Bottom panel shared by the report map screens. */
export default function ReportPanel({
  mode,
  onModeChange,
  note,
  onNoteChange,
  picked,
  onSubmit,
  onCancel,
}: Props) {
  const hint =
    mode === 'add'
      ? '📍 Tap the map where the school is'
      : '🗑️ Tap a highlighted zone to remove it';

  return (
    <View style={styles.panel}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>{hint}</Text>

        {/* Mode toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'add' && styles.toggleBtnInactive]}
            onPress={() => onModeChange('add')}
          >
            {mode === 'add' ? (
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.toggleBtnGradient}
              >
                <Text style={styles.toggleTextActive}>Add School</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleBtnInner}>
                <Text style={styles.toggleText}>Add School</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'remove' && styles.toggleBtnInactive]}
            onPress={() => onModeChange('remove')}
          >
            {mode === 'remove' ? (
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.toggleBtnGradient}
              >
                <Text style={styles.toggleTextActive}>Remove Zone</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleBtnInner}>
                <Text style={styles.toggleText}>Remove Zone</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {picked && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>✓ Location selected</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Short note (required)"
          placeholderTextColor={Colors.mutedText}
          value={note}
          onChangeText={onNoteChange}
        />
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitWrap} onPress={onSubmit}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>Submit Report</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.darkSurface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.lg,
    maxHeight: 280,
  },
  hint: { ...Typography.muted, textAlign: 'center', marginBottom: Spacing.md },

  toggleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  toggleBtn: { flex: 1, borderRadius: BorderRadius.sm, overflow: 'hidden' },
  toggleBtnInactive: {},
  toggleBtnGradient: { paddingVertical: Spacing.sm + 2, alignItems: 'center', borderRadius: BorderRadius.sm },
  toggleBtnInner: {
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
  },
  toggleTextActive: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  toggleText:       { color: Colors.mutedText, fontWeight: '600', fontSize: 13 },

  locationBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  locationBadgeText: { color: Colors.success, fontWeight: '600', fontSize: 12 },

  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },

  actionRow:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.sm,
  },
  cancelText:   { color: Colors.mutedText, fontWeight: '600' },
  submitWrap:   { flex: 2, borderRadius: BorderRadius.sm, overflow: 'hidden' },
  submitButton: { paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  submitText:   { color: Colors.white, fontWeight: '700' },
});
