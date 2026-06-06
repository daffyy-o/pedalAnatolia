import { RouteCoordinate, RouteInstruction, RouteResponse } from '../lib/api';

export interface RouteSnapshot {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  originName: string;
  destinationName: string;
  route: RouteResponse;
  routingProfile: string;
  savedRouteId?: string | null;
  publishedRouteId?: string | null;
}

export interface RouteMetadata {
  distance: number;
  time: number;
  geometry: RouteResponse['geometry'];
  instructions: RouteInstruction[];
  routingProfile: string;
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(ms: number) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} h ${mins} min`;
}
