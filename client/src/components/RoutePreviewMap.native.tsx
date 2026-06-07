import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';
import { RouteResponse } from '../lib/api';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

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
      <Marker coordinate={coordinates[0]} title="Start" pinColor={Colors.startMarker} />
      <Marker coordinate={coordinates[coordinates.length - 1]} title="End" pinColor={Colors.endMarker} />
      <Polyline coordinates={coordinates} strokeColor={Colors.routeLine} strokeWidth={5} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 240,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.lg,
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: 'rgba(249,16,102,0.25)',
  },
});
