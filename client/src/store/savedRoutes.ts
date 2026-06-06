import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { RouteCoordinate, RouteInstruction, RouteResponse } from '../lib/api';
import { supabase } from '../lib/supabase';
import { RouteSnapshot } from '../types/routes';

export interface SavedRoute {
  id: string;
  name: string;
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  originName: string;
  destinationName: string;
  route: RouteResponse;
  routingProfile: string;
  publishedRouteId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavedRouteRow {
  id: string;
  name: string;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  origin_name: string;
  destination_name: string;
  distance_meters: number;
  duration_ms: number;
  geometry: RouteResponse['geometry'];
  instructions: RouteInstruction[] | null;
  routing_profile: string;
  published_route_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PublishRouteInput {
  savedRouteId: string;
  title: string;
  description?: string;
}

interface SavedRoutesState {
  routes: SavedRoute[];
  loading: boolean;
  saving: boolean;
  error: string;
  loadRoutes: () => Promise<void>;
  addRoute: (route: Omit<SavedRoute, 'id' | 'publishedRouteId' | 'createdAt' | 'updatedAt'>) => Promise<SavedRoute>;
  removeRoute: (id: string) => Promise<void>;
  renameRoute: (id: string, newName: string) => Promise<void>;
  publishRoute: (input: PublishRouteInput) => Promise<string>;
  unpublishRoute: (id: string) => Promise<void>;
  clearError: () => void;
}

const LEGACY_SAVED_ROUTES_STORAGE_KEY = 'pedal-anatolia-saved-routes';

function rowToSavedRoute(row: SavedRouteRow): SavedRoute {
  return {
    id: row.id,
    name: row.name,
    origin: { lat: row.origin_lat, lon: row.origin_lon },
    destination: { lat: row.destination_lat, lon: row.destination_lon },
    originName: row.origin_name,
    destinationName: row.destination_name,
    route: {
      distance: Number(row.distance_meters),
      time: Number(row.duration_ms),
      geometry: row.geometry,
      instructions: row.instructions ?? [],
    },
    routingProfile: row.routing_profile,
    publishedRouteId: row.published_route_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function savedRouteToInsert(route: Omit<SavedRoute, 'id' | 'publishedRouteId' | 'createdAt' | 'updatedAt'>) {
  return {
    name: route.name,
    origin_lat: route.origin.lat,
    origin_lon: route.origin.lon,
    destination_lat: route.destination.lat,
    destination_lon: route.destination.lon,
    origin_name: route.originName,
    destination_name: route.destinationName,
    distance_meters: Math.round(route.route.distance),
    duration_ms: Math.round(route.route.time),
    geometry: route.route.geometry,
    instructions: route.route.instructions ?? [],
    routing_profile: route.routingProfile,
  };
}

function savedRouteToPublishedInsert(route: SavedRoute, title: string, description?: string) {
  return {
    saved_route_id: route.id,
    title: title.trim(),
    description: description?.trim() || null,
    origin_lat: route.origin.lat,
    origin_lon: route.origin.lon,
    destination_lat: route.destination.lat,
    destination_lon: route.destination.lon,
    origin_name: route.originName,
    destination_name: route.destinationName,
    distance_meters: Math.round(route.route.distance),
    duration_ms: Math.round(route.route.time),
    geometry: route.route.geometry,
    instructions: route.route.instructions ?? [],
    routing_profile: route.routingProfile,
  };
}

export function savedRouteToSnapshot(route: SavedRoute): RouteSnapshot {
  return {
    origin: route.origin,
    destination: route.destination,
    originName: route.originName,
    destinationName: route.destinationName,
    route: route.route,
    routingProfile: route.routingProfile,
    savedRouteId: route.id,
    publishedRouteId: route.publishedRouteId,
  };
}

export const useSavedRoutes = create<SavedRoutesState>((set, get) => ({
  routes: [],
  loading: false,
  saving: false,
  error: '',

  loadRoutes: async () => {
    void AsyncStorage.removeItem(LEGACY_SAVED_ROUTES_STORAGE_KEY);

    if (!supabase) {
      set({ error: 'Supabase is not configured.' });
      return;
    }

    set({ loading: true, error: '' });
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      routes: ((data ?? []) as SavedRouteRow[]).map(rowToSavedRoute),
      loading: false,
    });
  },

  addRoute: async (route) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ saving: true, error: '' });
    const { data, error } = await supabase
      .from('saved_routes')
      .insert(savedRouteToInsert(route))
      .select('*')
      .single();

    set({ saving: false });
    if (error) {
      set({ error: error.message });
      throw error;
    }

    const savedRoute = rowToSavedRoute(data as SavedRouteRow);
    set((state) => ({ routes: [savedRoute, ...state.routes] }));
    return savedRoute;
  },

  removeRoute: async (id) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ saving: true, error: '' });
    const { error } = await supabase.from('saved_routes').delete().eq('id', id);
    set({ saving: false });
    if (error) {
      set({ error: error.message });
      throw error;
    }

    set((state) => ({ routes: state.routes.filter((route) => route.id !== id) }));
  },

  renameRoute: async (id, newName) => {
    const name = newName.trim();
    if (!name) return;
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ saving: true, error: '' });
    const { error } = await supabase.from('saved_routes').update({ name }).eq('id', id);
    set({ saving: false });
    if (error) {
      set({ error: error.message });
      throw error;
    }

    set((state) => ({
      routes: state.routes.map((route) => (route.id === id ? { ...route, name } : route)),
    }));
  },

  publishRoute: async ({ savedRouteId, title, description }) => {
    const route = get().routes.find((item) => item.id === savedRouteId);
    if (!route) throw new Error('Saved route was not found.');
    if (!title.trim()) throw new Error('Route title is required.');
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ saving: true, error: '' });

    if (route.publishedRouteId) {
      const { error } = await supabase
        .from('published_routes')
        .update({ title: title.trim(), description: description?.trim() || null })
        .eq('id', route.publishedRouteId);

      set({ saving: false });
      if (error) {
        set({ error: error.message });
        throw error;
      }
      return route.publishedRouteId;
    }

    const { data, error } = await supabase
      .from('published_routes')
      .insert(savedRouteToPublishedInsert(route, title, description))
      .select('id')
      .single();

    if (error) {
      set({ saving: false, error: error.message });
      throw error;
    }

    await get().loadRoutes();
    set({ saving: false });
    return String(data.id);
  },

  unpublishRoute: async (id) => {
    const route = get().routes.find((item) => item.id === id);
    if (!route?.publishedRouteId) return;
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ saving: true, error: '' });
    const { error } = await supabase.from('published_routes').delete().eq('id', route.publishedRouteId);
    if (error) {
      set({ saving: false, error: error.message });
      throw error;
    }

    await get().loadRoutes();
    set({ saving: false });
  },

  clearError: () => set({ error: '' }),
}));
