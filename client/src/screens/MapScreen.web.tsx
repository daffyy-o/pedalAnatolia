import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform, Modal, TextInput, Button } from 'react-native';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import SearchBar from '../components/SearchBar';
import RouteSummary from '../components/RouteSummary';
import { fetchRoute, RouteCoordinate, RouteResponse } from '../lib/api';
import { usePreferences } from '../store/preferences';
import { useSavedRoutes } from '../store/savedRoutes';

// Fix Leaflet's default icon path issues
if (Platform.OS === 'web') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
}

const MapEventHandler = ({ handleMapPress }: { handleMapPress: (e: any) => void }) => {
  useMapEvents({
    click: (e) => {
      handleMapPress({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
    },
  });
  return null;
};

const FitBounds = ({ route }: { route: RouteResponse | null }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.geometry.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.geometry.coordinates.map(c => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
};

export default function MapScreen({ route: navRoute, navigation }: any) {
  const [origin, setOrigin] = useState<RouteCoordinate | null>(null);
  const [destination, setDestination] = useState<RouteCoordinate | null>(null);
  const [originName, setOriginName] = useState<string>('Map Point');
  const [destinationName, setDestinationName] = useState<string>('Map Point');

  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { avoidSchoolZonesDuringPeakHours } = usePreferences();
  const { addRoute } = useSavedRoutes();

  // Save Modal State
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [customRouteName, setCustomRouteName] = useState('');

  const initialCenter: [number, number] = [39.92077, 32.85411]; // Turkey
  const initialZoom = 6;

  // Mock school zone for testing
  const mockSchoolZoneWeb: [number, number][] = [
    [41.01, 28.97],
    [41.01, 28.98],
    [41.02, 28.98],
    [41.02, 28.97],
  ];

  useEffect(() => {
    if (navRoute?.params?.loadRoute) {
      const { origin: lOrg, destination: lDest, originName: lOrgName, destinationName: lDestName } = navRoute.params.loadRoute;
      setOrigin(lOrg);
      setOriginName(lOrgName);
      setDestination(lDest);
      setDestinationName(lDestName);
      calculateRoute(lOrg, lDest);
    }
  }, [navRoute?.params?.loadRoute]);

  const calculateRoute = async (start: RouteCoordinate, end: RouteCoordinate) => {
    setLoading(true);
    setErrorText(null);
    setRoute(null);
    try {
      const response = await fetchRoute(start, end, avoidSchoolZonesDuringPeakHours);
      setRoute(response);
    } catch (err: any) {
      setErrorText(err.message || 'An error occurred fetching the route.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    const coordStr = `Lat: ${coordinate.latitude.toFixed(4)}, Lon: ${coordinate.longitude.toFixed(4)}`;
    
    if (!origin) {
      setOrigin({ lat: coordinate.latitude, lon: coordinate.longitude });
      setOriginName(coordStr);
    } else if (!destination) {
      const dest = { lat: coordinate.latitude, lon: coordinate.longitude };
      setDestination(dest);
      setDestinationName(coordStr);
      calculateRoute(origin, dest);
    } else {
      setOrigin({ lat: coordinate.latitude, lon: coordinate.longitude });
      setOriginName(coordStr);
      setDestination(null);
      setDestinationName('Map Point');
      setRoute(null);
      setErrorText(null);
    }
  };

  const handleSearchSelect = (place: any) => {
    const coord = { lat: parseFloat(place.lat), lon: parseFloat(place.lon) };
    const name = place.display_name || 'Selected Place';
    
    if (!origin) {
      setOrigin(coord);
      setOriginName(name);
    } else if (!destination) {
      setDestination(coord);
      setDestinationName(name);
      calculateRoute(origin, coord);
    }
  };

  const handleSaveRoutePress = () => {
    if (origin && destination) {
      const shortOrigin = originName.split(',')[0];
      const shortDest = destinationName.split(',')[0];
      setCustomRouteName(`From ${shortOrigin} to ${shortDest}`);
      setSaveModalVisible(true);
    }
  };

  const confirmSaveRoute = () => {
    if (origin && destination) {
      addRoute({
        name: customRouteName.trim() || 'Saved Route',
        origin,
        destination,
        originName,
        destinationName,
      });
      setSaveModalVisible(false);
      alert('Route saved successfully!');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar 
          placeholder={!origin ? "Search for starting point..." : "Search for destination..."}
          onPlaceSelect={handleSearchSelect} 
        />
        <View style={styles.headerButtons}>
          <Text 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('SavedRoutes')}
          >
            Saved Routes
          </Text>
          <Text 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('Settings')}
          >
            Settings
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapContainer 
          center={initialCenter} 
          zoom={initialZoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventHandler handleMapPress={handleMapPress} />
          <FitBounds route={route} />

          <Polygon 
            positions={mockSchoolZoneWeb}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
          />

          {origin && <Marker position={[origin.lat, origin.lon]} title="Origin" />}
          {destination && <Marker position={[destination.lat, destination.lon]} title="Destination" />}
          
          {route && (
            <Polyline 
              positions={route.geometry.coordinates.map(c => [c[1], c[0]])}
              color="#4A90E2"
              weight={4}
            />
          )}
        </MapContainer>
      </View>

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
            onSaveRoute={handleSaveRoutePress}
          />
        )}
      </View>

      {/* Save Route Modal */}
      <Modal
        visible={saveModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Save Route</Text>
            <Text style={styles.modalSubtext}>Enter a custom name for your route:</Text>
            <TextInput
              style={styles.input}
              value={customRouteName}
              onChangeText={setCustomRouteName}
              placeholder="Route name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <View style={styles.modalBtn}>
                <Button title="Cancel" onPress={() => setSaveModalVisible(false)} color="#888" />
              </View>
              <View style={styles.modalBtn}>
                <Button title="Save" onPress={confirmSaveRoute} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 1000,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  headerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  mapContainer: {
    flex: 1,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: '90%',
    zIndex: 1000,
  },
  loader: {
    marginVertical: 10,
  },
  errorBox: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
  },
});
