import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type UserRole = 'user' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  age: number | null;
  role: UserRole;
  monthlyDistanceMeters: Record<string, number>;
}

interface ProfileRow {
  id: string;
  email: string | null;
  name: string;
  age: number | null;
  role: string;
}

interface DistanceRow {
  user_id: string;
  month: string;
  meters: number;
}

interface RegistrationInput {
  name: string;
  age: number;
  email: string;
  password: string;
}

interface RegistrationResult {
  success: boolean;
  requiresEmailConfirmation: boolean;
}

interface RouteCompletionInput {
  savedRouteId?: string | null;
  publishedRouteId?: string | null;
  durationMs?: number | null;
}

interface AuthState {
  users: AppUser[];
  currentUserId: string | null;
  initialized: boolean;
  loading: boolean;
  loginError: string;
  authNotice: string;
  initialize: () => () => void;
  login: (email: string, password: string) => Promise<boolean>;
  registerUser: (input: RegistrationInput) => Promise<RegistrationResult>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  addMonthlyDistance: (meters: number, input?: RouteCompletionInput) => Promise<number>;
  clearLoginError: () => void;
  clearAuthNotice: () => void;
}

const LEGACY_USERS_STORAGE_KEY = 'pedal-anatolia-users';

export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatKm(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function toAppUsers(profiles: ProfileRow[], distances: DistanceRow[]) {
  const distancesByUser = new Map<string, Record<string, number>>();

  for (const distance of distances) {
    const monthlyDistances = distancesByUser.get(distance.user_id) ?? {};
    monthlyDistances[distance.month.slice(0, 7)] = Number(distance.meters);
    distancesByUser.set(distance.user_id, monthlyDistances);
  }

  return profiles.map<AppUser>((profile) => ({
    id: profile.id,
    email: profile.email ?? '',
    name: profile.name,
    age: profile.age,
    role: profile.role === 'admin' ? 'admin' : 'user',
    monthlyDistanceMeters: distancesByUser.get(profile.id) ?? {},
  }));
}

async function readUsersForSession(session: Session) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: ownProfile, error: ownProfileError } = await supabase
    .from('profiles')
    .select('id, email, name, age, role')
    .eq('id', session.user.id)
    .single();

  if (ownProfileError) throw ownProfileError;

  let profiles = [ownProfile as ProfileRow];
  if (ownProfile.role === 'admin') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, age, role')
      .order('created_at', { ascending: true });

    if (error) throw error;
    profiles = (data ?? []) as ProfileRow[];
  }

  const { data: distances, error: distancesError } = await supabase
    .from('user_monthly_distances')
    .select('user_id, month, meters')
    .eq('month', `${currentMonthKey()}-01`);

  if (distancesError) throw distancesError;

  return toAppUsers(profiles, (distances ?? []) as DistanceRow[]);
}

export const useAuth = create<AuthState>((set, get) => {
  let currentSession: Session | null = null;

  const applySession = async (session: Session | null) => {
    currentSession = session;

    if (!session) {
      set({
        users: [],
        currentUserId: null,
        initialized: true,
        loading: false,
      });
      return;
    }

    const sessionUserId = session.user.id;
    try {
      const users = await readUsersForSession(session);
      if (currentSession?.user.id !== sessionUserId) return;
      set({
        users,
        currentUserId: sessionUserId,
        initialized: true,
        loading: false,
        loginError: '',
      });
    } catch (error) {
      if (currentSession?.user.id !== sessionUserId) return;
      set({
        users: [],
        currentUserId: null,
        initialized: true,
        loading: false,
        loginError: error instanceof Error ? error.message : 'Could not load your profile.',
      });
    }
  };

  return {
    users: [],
    currentUserId: null,
    initialized: false,
    loading: false,
    loginError: '',
    authNotice: '',

    initialize: () => {
      void AsyncStorage.removeItem(LEGACY_USERS_STORAGE_KEY);

      if (!supabase) {
        set({
          initialized: true,
          loginError: 'Supabase is not configured. Check the Expo environment variables.',
        });
        return () => {};
      }

      let active = true;
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active) return;
        if (error) {
          set({ initialized: true, loading: false, loginError: error.message });
          return;
        }
        void applySession(data.session);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => {
          if (active) void applySession(session);
        }, 0);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    },

    login: async (email, password) => {
      if (!supabase) {
        set({ loginError: 'Supabase is not configured.' });
        return false;
      }

      set({ loading: true, loginError: '', authNotice: '' });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.session) {
        set({
          loading: false,
          loginError: error?.message ?? 'Could not start a session.',
        });
        return false;
      }

      await applySession(data.session);
      return true;
    },

    registerUser: async (input) => {
      const email = input.email.trim().toLowerCase();
      const name = input.name.trim();

      if (!name || !email || !input.password || !Number.isInteger(input.age)) {
        set({ loginError: 'Please enter a valid name, age, email, and password.' });
        return { success: false, requiresEmailConfirmation: false };
      }
      if (name.length > 100) {
        set({ loginError: 'Name must contain at most 100 characters.' });
        return { success: false, requiresEmailConfirmation: false };
      }
      if (input.age < 1 || input.age > 120) {
        set({ loginError: 'Age must be between 1 and 120.' });
        return { success: false, requiresEmailConfirmation: false };
      }
      if (input.password.length < 8) {
        set({ loginError: 'Password must contain at least 8 characters.' });
        return { success: false, requiresEmailConfirmation: false };
      }
      if (!supabase) {
        set({ loginError: 'Supabase is not configured.' });
        return { success: false, requiresEmailConfirmation: false };
      }

      set({ loading: true, loginError: '', authNotice: '' });
      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: {
            name,
            age: input.age,
          },
        },
      });

      if (error || !data.user) {
        set({
          loading: false,
          loginError: error?.message ?? 'Could not create the account.',
        });
        return { success: false, requiresEmailConfirmation: false };
      }

      if (!data.session) {
        set({
          loading: false,
          authNotice: 'Check your email and confirm your account before signing in.',
        });
        return { success: true, requiresEmailConfirmation: true };
      }

      await applySession(data.session);
      return { success: true, requiresEmailConfirmation: false };
    },

    logout: async () => {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          set({ loginError: error.message });
          return;
        }
      }
      await applySession(null);
    },

    refreshUsers: async () => {
      if (!currentSession) return;

      try {
        const users = await readUsersForSession(currentSession);
        set({ users, currentUserId: currentSession.user.id });
      } catch (error) {
        set({
          loginError: error instanceof Error ? error.message : 'Could not refresh users.',
        });
      }
    },

    addMonthlyDistance: async (meters, input = {}) => {
      if (!supabase || !get().currentUserId) {
        throw new Error('You must be signed in to record a route.');
      }

      const roundedMeters = Math.round(meters);
      const { data, error } = await supabase.rpc('record_route_completion', {
        p_distance_meters: roundedMeters,
        p_duration_ms: input.durationMs == null ? null : Math.round(input.durationMs),
        p_saved_route_id: input.savedRouteId ?? null,
        p_published_route_id: input.publishedRouteId ?? null,
      });

      if (error) throw error;

      const totalMeters = Number(data);
      const month = currentMonthKey();
      const currentUserId = get().currentUserId;
      set((state) => ({
        users: state.users.map((user) =>
          user.id === currentUserId
            ? {
                ...user,
                monthlyDistanceMeters: {
                  ...user.monthlyDistanceMeters,
                  [month]: totalMeters,
                },
              }
            : user
        ),
      }));

      return totalMeters;
    },

    clearLoginError: () => set({ loginError: '' }),
    clearAuthNotice: () => set({ authNotice: '' }),
  };
});
