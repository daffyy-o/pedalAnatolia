import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'user' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  age: number;
  email: string;
  password: string;
  role: UserRole;
  monthlyDistanceMeters: Record<string, number>;
}

interface UsersState {
  users: AppUser[];
  currentUserId: string | null;
  loginError: string;
  registerUser: (input: {
    name: string;
    age: number;
    email: string;
    password: string;
    role: UserRole;
    adminPassword?: string;
  }) => boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addMonthlyDistance: (meters: number) => void;
  clearLoginError: () => void;
}

export const ADMIN_PASSWORD = 'pedal-admin';

export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatKm(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

export const useUsers = create<UsersState>()(
  persist(
    (set, get) => ({
      users: [
        {
          id: 'admin_demo',
          name: 'Demo Admin',
          age: 30,
          email: 'admin@pedal.com',
          password: 'admin123',
          role: 'admin',
          monthlyDistanceMeters: {},
        },
        {
          id: 'user_demo',
          name: 'Demo User',
          age: 18,
          email: 'user@pedal.com',
          password: 'user123',
          role: 'user',
          monthlyDistanceMeters: {},
        },
      ],
      currentUserId: null,
      loginError: '',

      registerUser: (input) => {
        const email = input.email.trim().toLowerCase();
        if (!input.name.trim() || !email || !input.password || !input.age) {
          set({ loginError: 'Please fill in name, age, email and password.' });
          return false;
        }
        if (input.role === 'admin' && input.adminPassword !== ADMIN_PASSWORD) {
          set({ loginError: 'Admin password is incorrect.' });
          return false;
        }
        if (get().users.some((u) => u.email.toLowerCase() === email)) {
          set({ loginError: 'This email already has an account.' });
          return false;
        }

        const user: AppUser = {
          id: `user_${Date.now()}`,
          name: input.name.trim(),
          age: input.age,
          email,
          password: input.password,
          role: input.role,
          monthlyDistanceMeters: {},
        };
        set((state) => ({
          users: [...state.users, user],
          currentUserId: user.id,
          loginError: '',
        }));
        return true;
      },

      login: (email, password) => {
        const normalized = email.trim().toLowerCase();
        const user = get().users.find(
          (u) => u.email.toLowerCase() === normalized && u.password === password
        );
        if (!user) {
          set({ loginError: 'Email or password is incorrect.' });
          return false;
        }
        set({ currentUserId: user.id, loginError: '' });
        return true;
      },

      logout: () => set({ currentUserId: null }),

      addMonthlyDistance: (meters) =>
        set((state) => {
          const month = currentMonthKey();
          return {
            users: state.users.map((user) =>
              user.id === state.currentUserId
                ? {
                    ...user,
                    monthlyDistanceMeters: {
                      ...user.monthlyDistanceMeters,
                      [month]: (user.monthlyDistanceMeters[month] || 0) + meters,
                    },
                  }
                : user
            ),
          };
        }),

      clearLoginError: () => set({ loginError: '' }),
    }),
    {
      name: 'pedal-anatolia-users',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

