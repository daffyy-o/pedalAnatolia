import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import ReportPanel, { ReportMode } from '../components/ReportPanel';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { getSchoolZoneFeatures, zoneToMapCoords } from '../lib/schoolZones';

const START = {
  latitude: 39.92,
  longitude: 32.85,
  latitudeDelta: 10,
  longitudeDelta: 15,
};

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

  const onMapPress = (e: any) => {
    if (mode !== 'add') return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLat(latitude);
    setLon(longitude);
    setZoneId(null);
  };

  const onSubmit = async () => {
    if (!note.trim()) {
      Alert.alert('Add a note');
      return;
    }
    if (mode === 'add') {
      if (lat == null || lon == null) {
        Alert.alert('Tap the map first');
        return;
      }
      await submitReport({ type: 'add', note, lat, lon });
    } else {
      if (!zoneId) {
        Alert.alert('Tap a red zone first');
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
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={START}
        onPress={onMapPress}
      >
        {zones.map((zone) => {
          const selected = zoneId === String(zone.id);
          return (
            <Polygon
              key={String(zone.id)}
              coordinates={zoneToMapCoords(zone)}
              fillColor={selected ? 'rgba(255, 140, 0, 0.5)' : 'rgba(255, 0, 0, 0.25)'}
              strokeColor={selected ? '#FF8C00' : '#c80000'}
              strokeWidth={selected ? 4 : 2}
              tappable={mode === 'remove'}
              onPress={() => mode === 'remove' && setZoneId(String(zone.id))}
            />
          );
        })}
        {lat != null && lon != null && (
          <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor="#4A90E2" />
        )}
      </MapView>

      <ReportPanel
        mode={mode}
        onModeChange={changeMode}
        note={note}
        onNoteChange={setNote}
        picked={mode === 'add' ? lat != null : zoneId != null}
        onSubmit={onSubmit}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
