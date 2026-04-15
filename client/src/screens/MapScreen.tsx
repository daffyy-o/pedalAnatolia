import React, { useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import SearchBar from '../components/SearchBar';
import RouteSummary from '../components/RouteSummary';
import { fetchRoute, RouteCoordinate, RouteResponse } from '../lib/api';
import { usePreferences } from '../store/preferences';

export default function MapScreen() {
  const [origin, setOrigin] = useState<RouteCoordinate | null>(null);
  const [destination, setDestination] = useState<RouteCoordinate | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { avoidSchoolZonesDuringPeakHours } = usePreferences();

  // Turkey boundaries for default region
  const initialRegion = {
    latitude: 39.92077,
    longitude: 32.85411,
    latitudeDelta: 10,
    longitudeDelta: 15,
  };

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
    if (!origin) {
      setOrigin({ lat: coordinate.latitude, lon: coordinate.longitude });
    } else if (!destination) {
      const dest = { lat: coordinate.latitude, lon: coordinate.longitude };
      setDestination(dest);
      calculateRoute(origin, dest);
    } else {
      // Reset and set new origin
      setOrigin({ lat: coordinate.latitude, lon: coordinate.longitude });
      setDestination(null);
      setRoute(null);
      setErrorText(null);
    }
  };

  const handleSearchSelect = (place: any) => {
    const coord = { lat: parseFloat(place.lat), lon: parseFloat(place.lon) };
    if (!origin) {
      setOrigin(coord);
    } else if (!destination) {
      setDestination(coord);
      calculateRoute(origin, coord);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar 
          placeholder={!origin ? "Search for starting point..." : "Search for destination..."}
          onPlaceSelect={handleSearchSelect} 
        />
      </View>

      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
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
          <RouteSummary distance={route.distance} time={route.time} />
        )}
      </View>
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
  }
});
