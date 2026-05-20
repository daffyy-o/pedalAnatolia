import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Modal, TextInput, Button, Platform } from 'react-native';
import MapView, { Polyline, Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import SearchBar from '../components/SearchBar';
import RouteSummary from '../components/RouteSummary';
import { useMapRouting } from '../hooks/useMapRouting';
import { getSchoolZoneFeatures, zoneToMapCoords } from '../lib/schoolZones';
import { usePreferences } from '../store/preferences';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { useSavedRoutes } from '../store/savedRoutes';

const TURKEY = {
  latitude: 39.92077,
  longitude: 32.85411,
  latitudeDelta: 10,
  longitudeDelta: 15,
};

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

  const mapRef = useRef<MapView>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [customRouteName, setCustomRouteName] = useState('');
  const zoneLayerKey = `${mapRenderVersion}-${avoidSchoolZones}-${schoolZones.length}`;

  useEffect(() => {
    if (navRoute?.params?.loadRoute) {
      loadSavedRoute(navRoute.params.loadRoute);
    }
  }, [navRoute?.params?.loadRoute, loadSavedRoute]);

  useEffect(() => {
    if (route && route.geometry.coordinates.length > 0) {
      const coords = route.geometry.coordinates.map((c) => ({
        latitude: c[1],
        longitude: c[0],
      }));
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeLineKey]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder={!origin ? 'Search start...' : 'Search end...'}
          onPlaceSelect={onSearchPlace}
        />
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

      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={TURKEY}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onMapTap(latitude, longitude);
        }}
      >
        {avoidSchoolZones &&
          schoolZones.map((zone) => (
            <Polygon
            key={`${zoneLayerKey}-zone-${String(zone.id)}`}
              coordinates={zoneToMapCoords(zone)}
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="rgba(200, 0, 0, 0.8)"
              strokeWidth={2}
              tappable={false}
            />
          ))}

        {origin && (
          <Marker
            key={`${zoneLayerKey}-start-${origin.lat}-${origin.lon}`}
            coordinate={{ latitude: origin.lat, longitude: origin.lon }}
            title="Start"
            pinColor="green"
          />
        )}
        {destination && (
          <Marker
            key={`${zoneLayerKey}-end-${destination.lat}-${destination.lon}`}
            coordinate={{ latitude: destination.lat, longitude: destination.lon }}
            title="End"
            pinColor="red"
          />
        )}

        {route && (
          <Polyline
            key={routeLineKey}
            coordinates={route.geometry.coordinates.map((c) => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor="#4A90E2"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.overlay}>
        {loading && <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />}
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
            <TextInput
              style={styles.input}
              value={customRouteName}
              onChangeText={setCustomRouteName}
              placeholder="Route name"
            />
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
  searchContainer: { position: 'absolute', top: 10, width: '100%', paddingHorizontal: 10, zIndex: 2 },
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
    elevation: 2,
  },
  map: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  overlay: { position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%', zIndex: 2 },
  loader: { marginVertical: 10 },
  errorBox: { backgroundColor: 'red', padding: 10, borderRadius: 8 },
  errorText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: 'white', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
