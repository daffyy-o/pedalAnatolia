import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RouteResponse } from '../lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
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
    <View style={styles.map}>
      <MapContainer center={positions[0]} zoom={10} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitRoute positions={positions} />
        <Marker position={positions[0]} />
        <Marker position={positions[positions.length - 1]} />
        <Polyline positions={positions} color="#4A90E2" weight={4} />
      </MapContainer>
    </View>
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
