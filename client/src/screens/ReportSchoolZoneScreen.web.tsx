import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ReportPanel, { ReportMode } from '../components/ReportPanel';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { getSchoolZoneFeatures } from '../lib/schoolZones';

function MapClicks({ mode, onAdd }: { mode: ReportMode; onAdd: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (mode === 'add') onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ReportSchoolZoneScreen({ navigation }: any) {
  const { submitReport, overrides, load } = useSchoolZoneReports();
  const [mode, setMode] = useState<ReportMode>('add');
  const [note, setNote] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const zones = getSchoolZoneFeatures(overrides);

  const resetPick = () => {
    setLat(null);
    setLon(null);
    setZoneId(null);
  };

  const changeMode = (next: ReportMode) => {
    setMode(next);
    resetPick();
  };

  const onSubmit = async () => {
    if (!note.trim()) {
      Alert.alert('Add a note');
      return;
    }
    if (mode === 'add') {
      if (lat == null || lon == null) {
        Alert.alert('Click the map first');
        return;
      }
      await submitReport({ type: 'add', note, lat, lon });
    } else {
      if (!zoneId) {
        Alert.alert('Click a red zone first');
        return;
      }
      await submitReport({ type: 'remove', note, zoneId });
    }
    Alert.alert('Sent', 'Developer will review.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <MapContainer center={[39.92, 32.85]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClicks
            mode={mode}
            onAdd={(a, b) => {
              setLat(a);
              setLon(b);
              setZoneId(null);
            }}
          />
          {zones.map((zone) => {
            const selected = zoneId === String(zone.id);
            const positions = zone.geometry.coordinates[0].map(([lng, la]) => [la, lng] as [number, number]);
            return (
              <Polygon
                key={String(zone.id)}
                positions={positions}
                pathOptions={{
                  color: selected ? '#FF8C00' : '#c80000',
                  fillOpacity: selected ? 0.5 : 0.25,
                }}
                eventHandlers={{
                  click: () => mode === 'remove' && setZoneId(String(zone.id)),
                }}
              />
            );
          })}
          {lat != null && lon != null && <Marker position={[lat, lon]} />}
        </MapContainer>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ReportPanel
          mode={mode}
          onModeChange={changeMode}
          note={note}
          onNoteChange={setNote}
          picked={mode === 'add' ? lat != null : zoneId != null}
          onSubmit={onSubmit}
          onCancel={() => navigation.goBack()}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, minHeight: 300 },
});
