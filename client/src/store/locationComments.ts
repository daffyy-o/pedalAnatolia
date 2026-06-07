import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface LocationComment {
  id: string;
  userId: string;
  userName: string;
  lat: number;
  lon: number;
  text: string;
  createdAt: string;
}

interface LocationCommentsRow {
  id: string;
  user_id: string;
  user_name: string;
  lat: number;
  lon: number;
  text: string;
  created_at: string;
}

interface LocationCommentsState {
  comments: LocationComment[];
  loading: boolean;
  error: string;
  loadComments: () => Promise<void>;
  addComment: (input: { lat: number; lon: number; text: string; userName?: string }) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  clearError: () => void;
}

function rowToLocationComment(row: LocationCommentsRow): LocationComment {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || 'Cyclist',
    lat: Number(row.lat),
    lon: Number(row.lon),
    text: row.text,
    createdAt: row.created_at,
  };
}

export const useLocationComments = create<LocationCommentsState>((set, get) => ({
  comments: [],
  loading: false,
  error: '',

  loadComments: async () => {
    if (!supabase) {
      set({ error: 'Supabase is not configured.' });
      return;
    }

    set({ loading: true, error: '' });
    const { data, error } = await supabase
      .from('map_notes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      comments: ((data ?? []) as LocationCommentsRow[]).map(rowToLocationComment),
      loading: false,
    });
  },

  addComment: async (input) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ loading: true, error: '' });
    const { data, error } = await supabase
      .from('map_notes')
      .insert({
        lat: input.lat,
        lon: input.lon,
        text: input.text.trim(),
      })
      .select('*')
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }

    const newComment = rowToLocationComment(data as LocationCommentsRow);
    set((state) => ({
      comments: [...state.comments, newComment],
      loading: false,
    }));
  },

  deleteComment: async (id) => {
    if (!supabase) throw new Error('Supabase is not configured.');

    set({ loading: true, error: '' });
    const { error } = await supabase
      .from('map_notes')
      .delete()
      .eq('id', id);

    if (error) {
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }

    set((state) => ({
      comments: state.comments.filter((comment) => comment.id !== id),
      loading: false,
    }));
  },

  clearError: () => set({ error: '' }),
}));
