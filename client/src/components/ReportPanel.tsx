import React from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity } from 'react-native';

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

/** Bottom bar shared by the report map screens. */
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
      ? 'Tap the map where the school is'
      : 'Tap a red zone to remove it';

  return (
    <View style={styles.panel}>
      <Text style={styles.hint}>{hint}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, mode === 'add' && styles.chipOn]}
          onPress={() => onModeChange('add')}
        >
          <Text style={mode === 'add' ? styles.chipOnText : styles.chipText}>Add school</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, mode === 'remove' && styles.chipOn]}
          onPress={() => onModeChange('remove')}
        >
          <Text style={mode === 'remove' ? styles.chipOnText : styles.chipText}>Remove zone</Text>
        </TouchableOpacity>
      </View>
      {picked && <Text style={styles.ok}>Location selected</Text>}
      <TextInput
        style={styles.input}
        placeholder="Short note (required)"
        value={note}
        onChangeText={onNoteChange}
      />
      <View style={styles.row}>
        <View style={styles.btn}>
          <Button title="Cancel" color="#888" onPress={onCancel} />
        </View>
        <View style={styles.btn}>
          <Button title="Submit" onPress={onSubmit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#ddd' },
  hint: { fontSize: 14, color: '#555', marginBottom: 10, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' },
  chipOn: { backgroundColor: '#4A90E2' },
  chipText: { color: '#333' },
  chipOnText: { color: '#fff', fontWeight: '600' },
  ok: { color: '#4A90E2', marginBottom: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  btn: { flex: 1 },
});
