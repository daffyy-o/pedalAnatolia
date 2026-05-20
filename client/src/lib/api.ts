import axios from 'axios';

import { Platform } from 'react-native';
import { SchoolZoneFeature } from './schoolZones';

// Set EXPO_PUBLIC_GRAPHHOPPER_BASE_URL in client/.env (see .env.example)
const BASE_URL =
  process.env.EXPO_PUBLIC_GRAPHHOPPER_BASE_URL ||
  (Platform.OS === 'web' ? 'http://localhost:8989' : '');

export interface RouteCoordinate {
  lat: number;
  lon: number;
}

export interface RouteInstruction {
  text: string;
  distance: number;
  time: number;
  sign: number;
  street_name?: string;
}

export interface RouteResponse {
  geometry: {
    type: string;
    coordinates: [number, number][]; // [lon, lat]
  };
  distance: number;
  time: number;
  instructions: RouteInstruction[];
}

type CustomModel = {
  priority: Array<{ if: string; multiply_by: number }>;
  areas: { type: 'FeatureCollection'; features: SchoolZoneFeature[] };
};

function buildRuntimeSchoolModel(zones: SchoolZoneFeature[]): CustomModel {
  const priority: Array<{ if: string; multiply_by: number }> = [
    { if: 'road_environment == FERRY', multiply_by: 0.0 },
    { if: 'road_class == MOTORWAY || road_class == TRUNK', multiply_by: 0.0 },
    { if: 'road_class == PRIMARY', multiply_by: 0.2 },
  ];

  const features = zones.map((zone, i) => ({
    ...zone,
    id: `runtime_zone_${i}`,
  }));

  for (const zone of features) {
    priority.push({ if: `in_${zone.id}`, multiply_by: 0.1 });
  }

  return {
    priority,
    areas: { type: 'FeatureCollection', features },
  };
}

export const fetchRoute = async (
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  avoidSchoolZones: boolean = false,
  runtimeSchoolZones: SchoolZoneFeature[] = []
): Promise<RouteResponse> => {
  if (!BASE_URL) {
    throw new Error(
      'Routing server URL not set. Add EXPO_PUBLIC_GRAPHHOPPER_BASE_URL to client/.env (your PC Wi-Fi IP, port 8989).'
    );
  }

  try {
    // Determine bounds briefly: Turkey bounding box approx (35-43 N, 25-45 E)
    // We check the input coordinates
    const inTurkeyBounds = (p: RouteCoordinate) =>
      p.lat >= 35.8 && p.lat <= 42.1 && p.lon >= 25.6 && p.lon <= 44.8;

    if (!inTurkeyBounds(origin) || !inTurkeyBounds(destination)) {
      throw new Error("This point is outside the supported area (Turkey).");
    }

    const shouldUseRuntimeZones = avoidSchoolZones && runtimeSchoolZones.length > 0;
    const payload: Record<string, unknown> = {
      points: [
        [origin.lon, origin.lat],
        [destination.lon, destination.lat],
      ],
      profile: shouldUseRuntimeZones ? 'bike' : avoidSchoolZones ? 'bike_school_zones' : 'bike',
      points_encoded: false,
    };
    if (shouldUseRuntimeZones) {
      payload.custom_model = buildRuntimeSchoolModel(runtimeSchoolZones);
    }

    const response = await axios.post(`${BASE_URL}/route`, payload);

    const path = response.data.paths[0];
    
    if (!path) {
      throw new Error("No bicycle route found between these points.");
    }

    if (!path.points || !path.points.coordinates) {
        throw new Error("Route data is unavailable. Please recalculate.");
    }

    return {
      geometry: path.points,
      distance: path.distance,
      time: path.time,
      instructions: path.instructions || [],
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 400 && error.response.data && error.response.data.message) {
         if (error.response.data.message.toLowerCase().includes('not found') || error.response.data.message.includes('Connection between locations not found')) {
            throw new Error("No bicycle route found between these points.");
         }
      }
      throw new Error(
        `Could not reach the routing server (${BASE_URL}). Is the backend running? Same Wi-Fi as your phone?`
      );
    }
    throw error; // Re-throw our custom bounds/logic errors directly
  }
};
