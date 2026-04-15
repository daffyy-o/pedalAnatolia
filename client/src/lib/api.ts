import axios from 'axios';

// Get base URL from environment or fallback for local development
const BASE_URL = process.env.EXPO_PUBLIC_GRAPHHOPPER_BASE_URL || 'http://10.5.57.105:8989';

export interface RouteCoordinate {
  lat: number;
  lon: number;
}

export interface RouteResponse {
  geometry: {
    type: string;
    coordinates: [number, number][]; // [lon, lat]
  };
  distance: number;
  time: number;
}

export const fetchRoute = async (
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  avoidSchoolZones: boolean = false
): Promise<RouteResponse> => {
  try {
    // Determine bounds briefly: Turkey bounding box approx (35-43 N, 25-45 E)
    // We check the input coordinates
    const inTurkeyBounds = (p: RouteCoordinate) =>
      p.lat >= 35.8 && p.lat <= 42.1 && p.lon >= 25.6 && p.lon <= 44.8;

    if (!inTurkeyBounds(origin) || !inTurkeyBounds(destination)) {
      throw new Error("This point is outside the supported area (Turkey).");
    }

    const response = await axios.get(`${BASE_URL}/route`, {
      params: {
        point: [`${origin.lat},${origin.lon}`, `${destination.lat},${destination.lon}`],
        profile: avoidSchoolZones ? 'bike_school_zones' : 'bike',
        points_encoded: false,
      },
      paramsSerializer: {
        indexes: null // to format point=lat,lon&point=lat,lon instead of point[]=...
      }
    });

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
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 400 && error.response.data && error.response.data.message) {
         if (error.response.data.message.toLowerCase().includes('not found') || error.response.data.message.includes('Connection between locations not found')) {
            throw new Error("No bicycle route found between these points.");
         }
      }
      throw new Error("Could not reach the routing server. Please try again.");
    }
    throw error; // Re-throw our custom bounds/logic errors directly
  }
};
