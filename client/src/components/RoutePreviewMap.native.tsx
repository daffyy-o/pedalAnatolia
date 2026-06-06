import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';
import { RouteResponse } from '../lib/api';

export default function RoutePreviewMap({ route }: { route: RouteResponse }) {
  const mapRef = useRef<MapView>(null);
  const coordinates = useMemo(
    () =>
      route.geometry.coordinates.map((coord) => ({
        latitude: coord[1],
        longitude: coord[0],
      })),
    [route.geometry.coordinates]
  );

  useEffect(() => {
    if (coordinates.length > 0) {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 35, right: 35, bottom: 35, left: 35 },
        animated: false,
      });
    }
  }, [coordinates]);

  if (coordinates.length === 0) return <View style={styles.map} />;

  return (
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={styles.map}
      initialRegion={{
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      <Marker coordinate={coordinates[0]} title="Start" pinColor="green" />
      <Marker coordinate={coordinates[coordinates.length - 1]} title="End" pinColor="red" />
      <Polyline coordinates={coordinates} strokeColor="#4A90E2" strokeWidth={4} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    backgroundColor: '#e0e0e0',
  },
});
