import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type LeaderboardPeriod = 'daily' | 'monthly' | 'yearly' | 'all_time';
export type LeaderboardSortKey =
  | 'distanceMeters'
  | 'completedRides'
  | 'savedRoutesCount'
  | 'publishedRoutesCount'
  | 'averageRating'
  | 'name';

export interface LeaderboardUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  distanceMeters: number;
  completedRides: number;
  savedRoutesCount: number;
  publishedRoutesCount: number;
  averageRating: number;
}

interface LeaderboardRow {
  user_id: string;
  name: string;
  email: string;
  role: string;
  distance_meters: number;
  completed_rides: number;
  saved_routes_count: number;
  published_routes_count: number;
  average_rating: number;
}

interface AdminLeaderboardState {
  rows: LeaderboardUser[];
  period: LeaderboardPeriod;
  sortKey: LeaderboardSortKey;
  loading: boolean;
  error: string;
  setPeriod: (period: LeaderboardPeriod) => void;
  setSortKey: (sortKey: LeaderboardSortKey) => void;
  load: () => Promise<void>;
}

function rowToUser(row: LeaderboardRow): LeaderboardUser {
  return {
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    distanceMeters: Number(row.distance_meters ?? 0),
    completedRides: Number(row.completed_rides ?? 0),
    savedRoutesCount: Number(row.saved_routes_count ?? 0),
    publishedRoutesCount: Number(row.published_routes_count ?? 0),
    averageRating: Number(row.average_rating ?? 0),
  };
}

function sortRows(rows: LeaderboardUser[], sortKey: LeaderboardSortKey) {
  return [...rows].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return Number(b[sortKey]) - Number(a[sortKey]);
  });
}

export const useAdminLeaderboard = create<AdminLeaderboardState>((set, get) => ({
  rows: [],
  period: 'monthly',
  sortKey: 'distanceMeters',
  loading: false,
  error: '',

  setPeriod: (period) => set({ period }),
  setSortKey: (sortKey) => set((state) => ({ sortKey, rows: sortRows(state.rows, sortKey) })),

  load: async () => {
    if (!supabase) {
      set({ error: 'Supabase is not configured.' });
      return;
    }

    set({ loading: true, error: '' });
    const { data, error } = await supabase.rpc('get_admin_leaderboard', {
      p_period: get().period,
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      rows: sortRows(((data ?? []) as LeaderboardRow[]).map(rowToUser), get().sortKey),
      loading: false,
    });
  },
}));
