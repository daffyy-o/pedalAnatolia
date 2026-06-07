import { create } from 'zustand';
import { RouteCoordinate, RouteInstruction, RouteResponse } from '../lib/api';
import { supabase } from '../lib/supabase';
import { RouteSnapshot } from '../types/routes';

export type RouteBoardSort = 'newest' | 'rating' | 'rides' | 'shortest' | 'longest';

export interface PublishedRoute {
  id: string;
  ownerId: string;
  ownerName: string;
  savedRouteId: string | null;
  title: string;
  description: string;
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  originName: string;
  destinationName: string;
  route: RouteResponse;
  routingProfile: string;
  ratingAverage: number;
  ratingCount: number;
  rideCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PublishedRouteRow {
  id: string;
  owner_id: string;
  owner_name: string | null;
  saved_route_id: string | null;
  title: string;
  description: string | null;
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
  rating_average: number | null;
  rating_count: number | null;
  ride_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface RouteBoardFilters {
  search: string;
  minDistanceKm: string;
  maxDistanceKm: string;
  minRating: number;
  sort: RouteBoardSort;
}

interface RouteBoardState {
  routes: PublishedRoute[];
  selectedRoute: PublishedRoute | null;
  filters: RouteBoardFilters;
  page: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  detailLoading: boolean;
  ratingLoading: boolean;
  error: string;
  myRating: number | null;
  canRateSelectedRoute: boolean;
  setFilters: (filters: Partial<RouteBoardFilters>) => void;
  loadRoutes: (reset?: boolean) => Promise<void>;
  loadRouteDetail: (id: string, currentUserId?: string | null) => Promise<void>;
  rateRoute: (routeId: string, rating: number) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  clearSelectedRoute: () => void;
  clearError: () => void;
}

const DEFAULT_FILTERS: RouteBoardFilters = {
  search: '',
  minDistanceKm: '',
  maxDistanceKm: '',
  minRating: 0,
  sort: 'newest',
};

function rowToPublishedRoute(row: PublishedRouteRow): PublishedRoute {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name || 'Cyclist',
    savedRouteId: row.saved_route_id,
    title: row.title,
    description: row.description || '',
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
    ratingAverage: Number(row.rating_average ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    rideCount: Number(row.ride_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortColumn(sort: RouteBoardSort) {
  switch (sort) {
    case 'rating':
      return { column: 'rating_average', ascending: false };
    case 'rides':
      return { column: 'ride_count', ascending: false };
    case 'shortest':
      return { column: 'distance_meters', ascending: true };
    case 'longest':
      return { column: 'distance_meters', ascending: false };
    default:
      return { column: 'created_at', ascending: false };
  }
}

function escapeSearchTerm(value: string) {
  return value.replace(/[%(),]/g, '').trim();
}

export function publishedRouteToSnapshot(route: PublishedRoute): RouteSnapshot {
  return {
    origin: route.origin,
    destination: route.destination,
    originName: route.originName,
    destinationName: route.destinationName,
    route: route.route,
    routingProfile: route.routingProfile,
    savedRouteId: null, // Do not propagate owner's savedRouteId to riders
    publishedRouteId: route.id,
  };
}

export const useRouteBoard = create<RouteBoardState>((set, get) => ({
  routes: [],
  selectedRoute: null,
  filters: DEFAULT_FILTERS,
  page: 0,
  pageSize: 20,
  hasMore: true,
  loading: false,
  detailLoading: false,
  ratingLoading: false,
  error: '',
  myRating: null,
  canRateSelectedRoute: false,

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 0,
      hasMore: true,
    })),

  loadRoutes: async (reset = true) => {
    if (!supabase) {
      set({ error: 'Supabase is not configured.' });
      return;
    }

    const state = get();
    const nextPage = reset ? 0 : state.page + 1;
    const from = nextPage * state.pageSize;
    const to = from + state.pageSize - 1;
    const { filters } = state;
    const sort = sortColumn(filters.sort);

    set({ loading: true, error: '' });
    let query = supabase
      .from('published_routes')
      .select('*')
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);

    const minKm = Number(filters.minDistanceKm);
    const maxKm = Number(filters.maxDistanceKm);
    if (Number.isFinite(minKm) && minKm > 0) {
      query = query.gte('distance_meters', Math.round(minKm * 1000));
    }
    if (Number.isFinite(maxKm) && maxKm > 0) {
      query = query.lte('distance_meters', Math.round(maxKm * 1000));
    }
    if (filters.minRating > 0) {
      query = query.gte('rating_average', filters.minRating);
    }

    const term = escapeSearchTerm(filters.search);
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(
        `title.ilike.${pattern},description.ilike.${pattern},origin_name.ilike.${pattern},destination_name.ilike.${pattern},owner_name.ilike.${pattern}`
      );
    }

    const { data, error } = await query;
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    const routes = ((data ?? []) as PublishedRouteRow[]).map(rowToPublishedRoute);
    set({
      routes: reset ? routes : [...state.routes, ...routes],
      page: nextPage,
      hasMore: routes.length === state.pageSize,
      loading: false,
    });
  },

  loadRouteDetail: async (id, currentUserId) => {
    if (!supabase) {
      set({ error: 'Supabase is not configured.' });
      return;
    }

    set({ detailLoading: true, error: '', myRating: null, canRateSelectedRoute: false });
    const { data, error } = await supabase.from('published_routes').select('*').eq('id', id).single();
    if (error) {
      set({ detailLoading: false, error: error.message });
      return;
    }

    const route = rowToPublishedRoute(data as PublishedRouteRow);
    let myRating: number | null = null;
    let canRateSelectedRoute = false;

    if (currentUserId) {
      const [{ data: ratings }, { count: completions }] = await Promise.all([
        supabase.from('route_ratings').select('rating').eq('published_route_id', id).eq('user_id', currentUserId).maybeSingle(),
        supabase
          .from('route_completions')
          .select('id', { count: 'exact', head: true })
          .eq('published_route_id', id)
          .eq('user_id', currentUserId),
      ]);

      myRating = ratings?.rating ?? null;
      canRateSelectedRoute = route.ownerId !== currentUserId && Number(completions ?? 0) > 0;
    }

    set({
      selectedRoute: route,
      detailLoading: false,
      myRating,
      canRateSelectedRoute,
    });
  },

  rateRoute: async (routeId, rating) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.');

    set({ ratingLoading: true, error: '' });

    try {
      const sessionRes = await supabase.auth.getSession();
      const currentUserId = sessionRes.data.session?.user?.id;
      if (!currentUserId) throw new Error('Authentication required.');

      // Check if rating already exists for this user to avoid permission issues
      const { data: existing, error: fetchError } = await supabase
        .from('route_ratings')
        .select('rating')
        .eq('published_route_id', routeId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (fetchError) {
        set({ ratingLoading: false, error: fetchError.message });
        throw new Error(fetchError.message);
      }

      let error;
      if (existing) {
        // Perform a clean update on rating column only for this specific user
        const res = await supabase
          .from('route_ratings')
          .update({ rating })
          .eq('published_route_id', routeId)
          .eq('user_id', currentUserId);
        error = res.error;
      } else {
        // Perform a clean insert
        const res = await supabase
          .from('route_ratings')
          .insert({ published_route_id: routeId, rating, user_id: currentUserId });
        error = res.error;
      }

      set({ ratingLoading: false });
      if (error) {
        set({ error: error.message });
        throw new Error(error.message);
      }

      set({ myRating: rating });
      await get().loadRoutes(true);
    } catch (err: any) {
      set({ ratingLoading: false });
      throw err;
    }
  },

  deleteRoute: async (routeId) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ loading: true, error: '' });
    const { error } = await supabase.from('published_routes').delete().eq('id', routeId);
    if (error) {
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }

    set((state) => ({
      routes: state.routes.filter((route) => route.id !== routeId),
      selectedRoute: state.selectedRoute?.id === routeId ? null : state.selectedRoute,
      loading: false,
    }));
  },

  clearSelectedRoute: () => set({ selectedRoute: null, myRating: null, canRateSelectedRoute: false }),
  clearError: () => set({ error: '' }),
}));
