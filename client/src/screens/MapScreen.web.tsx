import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform, Modal, TextInput, Button } from 'react-native';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import SearchBar from '../components/SearchBar';
import RouteSummary from '../components/RouteSummary';
import { useMapRouting } from '../hooks/useMapRouting';
import { getSchoolZoneFeatures, zoneToMapCoords } from '../lib/schoolZones';
import { usePreferences } from '../store/preferences';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { useSavedRoutes } from '../store/savedRoutes';
import { RouteResponse } from '../lib/api';

if (Platform.OS === 'web') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
}

function MapClicks({ onMapTap }: { onMapTap: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => onMapTap(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function FitBounds({ route }: { route: RouteResponse | null }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.geometry.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.geometry.coordinates.map((c) => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
}

export default function MapScreen({ route: navRoute, navigation }: any) {
  const { avoidSchoolZones } = usePreferences();
  const overrides = useSchoolZoneReports((s) => s.overrides);
  const schoolZones = useMemo(() => getSchoolZoneFeatures(overrides), [overrides]);
  const { addRoute } = useSavedRoutes();

  const {
    origin,
    destination,
    originName,
    destinationName,
    route,
    errorText,
    loading,
    hint,
    routeLineKey,
    mapRenderVersion,
    clearAll,
    onMapTap,
    onSearchPlace,
    loadSavedRoute,
  } = useMapRouting(avoidSchoolZones, schoolZones);

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [customRouteName, setCustomRouteName] = useState('');
  const zoneLayerKey = `${mapRenderVersion}-${avoidSchoolZones}-${schoolZones.length}`;

  useEffect(() => {
    if (navRoute?.params?.loadRoute) {
      loadSavedRoute(navRoute.params.loadRoute);
    }
  }, [navRoute?.params?.loadRoute, loadSavedRoute]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar placeholder={!origin ? 'Search start...' : 'Search end...'} onPlaceSelect={onSearchPlace} />
        <Text style={styles.hint}>{hint}</Text>
        <View style={styles.headerButtons}>
          {(origin || destination || route) && (
            <Text style={styles.headerButton} onPress={clearAll}>
              Clear
            </Text>
          )}
          <Text style={styles.headerButton} onPress={() => navigation.navigate('ReportSchoolZone')}>
            Report
          </Text>
          <Text style={styles.headerButton} onPress={() => navigation.navigate('SavedRoutes')}>
            Saved
          </Text>
          <Text style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
            Settings
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapContainer center={[39.92, 32.85]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClicks onMapTap={onMapTap} />
          <FitBounds route={route} />
          {avoidSchoolZones &&
            schoolZones.map((zone) => (
              <Polygon
                key={`${zoneLayerKey}-zone-${String(zone.id)}`}
                positions={zoneToMapCoords(zone).map((c) => [c.latitude, c.longitude] as [number, number])}
                pathOptions={{ color: '#c62828', fillColor: '#ef5350', fillOpacity: 0.2, weight: 2 }}
              />
            ))}
          {origin && (
            <Marker
              key={`${zoneLayerKey}-start-${origin.lat}-${origin.lon}`}
              position={[origin.lat, origin.lon]}
              title="Start"
            />
          )}
          {destination && (
            <Marker
              key={`${zoneLayerKey}-end-${destination.lat}-${destination.lon}`}
              position={[destination.lat, destination.lon]}
              title="End"
            />
          )}
          {route && (
            <Polyline
              key={routeLineKey}
              positions={route.geometry.coordinates.map((c) => [c[1], c[0]])}
              color="#4A90E2"
              weight={4}
            />
          )}
        </MapContainer>
      </View>

      <View style={styles.overlay}>
        {loading && <ActivityIndicator size="large" color="#4A90E2" />}
        {errorText && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        )}
        {route && !errorText && (
          <RouteSummary
            distance={route.distance}
            time={route.time}
            instructions={route.instructions}
            onSaveRoute={() => {
              setCustomRouteName(`From ${originName} to ${destinationName}`);
              setSaveModalVisible(true);
            }}
            schoolZonesAvoided={avoidSchoolZones}
          />
        )}
      </View>

      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Save route</Text>
            <TextInput style={styles.input} value={customRouteName} onChangeText={setCustomRouteName} />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setSaveModalVisible(false)} color="#888" />
              <Button
                title="Save"
                onPress={() => {
                  if (origin && destination) {
                    addRoute({
                      name: customRouteName.trim() || 'Saved route',
                      origin,
                      destination,
                      originName,
                      destinationName,
                    });
                    setSaveModalVisible(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { position: 'absolute', top: 10, width: '100%', paddingHorizontal: 10, zIndex: 1000 },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 6,
    fontSize: 12,
    color: '#444',
    marginTop: 4,
    textAlign: 'center',
  },
  headerButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' },
  headerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  mapContainer: { flex: 1, zIndex: 1 },
  overlay: { position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%', zIndex: 1000 },
  errorBox: { backgroundColor: 'red', padding: 10, borderRadius: 8 },
  errorText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: 'white', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
