import bundled from '../data/school-zones.json';

export interface SchoolZoneFeature {
  type: 'Feature';
  id: string;
  properties: { name?: string };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

/** Zones from the JSON file, minus removed, plus added from approved reports. */
export function getSchoolZoneFeatures(
  overrides: { added: SchoolZoneFeature[]; removedIds: string[] }
): SchoolZoneFeature[] {
  const removed = new Set(overrides.removedIds.map(String));
  const base = (bundled.features as SchoolZoneFeature[]).filter((z) => !removed.has(String(z.id)));
  const added = overrides.added.filter((z) => !removed.has(String(z.id)));
  return [...base, ...added];
}

/** For react-native-maps Polygon. */
export function zoneToMapCoords(zone: SchoolZoneFeature) {
  return zone.geometry.coordinates[0].map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  }));
}

/** Small square around a tap (~100 m). */
export function boxAroundPoint(lon: number, lat: number, size = 0.001): number[][][] {
  return [
    [
      [lon - size, lat - size],
      [lon + size, lat - size],
      [lon + size, lat + size],
      [lon - size, lat + size],
      [lon - size, lat - size],
    ],
  ];
}
