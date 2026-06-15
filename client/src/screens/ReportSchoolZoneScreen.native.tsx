import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Alert } from '../components/CustomAlert';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import ReportPanel, { ReportMode } from '../components/ReportPanel';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { getSchoolZoneFeatures, zoneToMapCoords } from '../lib/schoolZones';
import { Colors } from '../lib/theme';

const START = {
  latitude: 41.00,
  longitude: 29.13,
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
              fillColor={selected ? 'rgba(255,133,82,0.45)' : Colors.schoolZone}
              strokeColor={selected ? Colors.accent : Colors.schoolZoneStroke}
              strokeWidth={selected ? 4 : 2}
              tappable={mode === 'remove'}
              onPress={() => mode === 'remove' && setZoneId(String(zone.id))}
            />
          );
        })}
        {lat != null && lon != null && (
          <Marker coordinate={{ latitude: lat, longitude: lon }} pinColor={Colors.primary} />
        )}
      </MapView>

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
  map: { flex: 1 },
});
