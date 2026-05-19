import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Modal, TextInput, Button } from 'react-native';
import MapView, { Polyline, Marker, Polygon } from 'react-native-maps';
import SearchBar from '../components/SearchBar';
import RouteSummary from '../components/RouteSummary';
import { fetchRoute, RouteCoordinate, RouteResponse } from '../lib/api';
import { usePreferences } from '../store/preferences';
import { useSavedRoutes } from '../store/savedRoutes';

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

  const mapRef = useRef<MapView>(null);

  // Save Modal State
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [customRouteName, setCustomRouteName] = useState('');

  // Turkey boundaries for default region
  const initialRegion = {
    latitude: 39.92077,
    longitude: 32.85411,
    latitudeDelta: 10,
    longitudeDelta: 15,
  };

  // Mock school zone for testing
  const mockSchoolZone = [
    { latitude: 41.01, longitude: 28.97 },
    { latitude: 41.01, longitude: 28.98 },
    { latitude: 41.02, longitude: 28.98 },
    { latitude: 41.02, longitude: 28.97 },
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

  useEffect(() => {
    if (route && route.geometry.coordinates.length > 0) {
      const coords = route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [route]);

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
      // Reset and set new origin
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

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {/* Render Mock School Zone if Avoid School Zones is toggled (or always) - We will show it always to let user test it easily */}
        <Polygon
          coordinates={mockSchoolZone}
          fillColor="rgba(255, 0, 0, 0.2)"
          strokeColor="rgba(255, 0, 0, 0.8)"
          strokeWidth={2}
        />

        {origin && <Marker coordinate={{ latitude: origin.lat, longitude: origin.lon }} title="Origin" pinColor="green" />}
        {destination && <Marker coordinate={{ latitude: destination.lat, longitude: destination.lon }} title="Destination" pinColor="red" />}
        
        {route && (
          <Polyline 
            coordinates={route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }))}
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
    zIndex: 2,
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
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: '90%',
    zIndex: 2,
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
