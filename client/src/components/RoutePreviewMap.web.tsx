import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RouteResponse } from '../lib/api';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const startIcon = L.divIcon({
  className: 'pedal-preview-start',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:${Colors.startMarker};border:2px solid white;box-shadow:0 1px 6px rgba(34,197,94,.7);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const endIcon = L.divIcon({
  className: 'pedal-preview-end',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:${Colors.endMarker};border:2px solid white;box-shadow:0 1px 6px rgba(249,16,102,.7);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [30, 30] });
    }
  }, [map, positions]);
  return null;
}

export default function RoutePreviewMap({ route }: { route: RouteResponse }) {
  const positions = useMemo(
    () => route.geometry.coordinates.map((coord) => [coord[1], coord[0]] as [number, number]),
    [route.geometry.coordinates]
  );

  if (positions.length === 0) return <View style={styles.map} />;

  return (
    <View style={styles.mapWrapper}>
      <MapContainer
        center={positions[0]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitRoute positions={positions} />
        <Marker position={positions[0]} icon={startIcon} />
        <Marker position={positions[positions.length - 1]} icon={endIcon} />
        <Polyline positions={positions} color={Colors.routeLine} weight={4} />
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    height: 240,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(249,16,102,0.25)',
  },
  map: {
    height: 240,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkSurface,
    marginTop: Spacing.lg,
  },
});
