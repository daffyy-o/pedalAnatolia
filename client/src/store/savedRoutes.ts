import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteCoordinate } from '../lib/api';

export interface SavedRoute {
  id: string;
  name: string;
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  originName: string;
  destinationName: string;
  timestamp: number;
}

interface SavedRoutesState {
  routes: SavedRoute[];
  addRoute: (route: Omit<SavedRoute, 'id' | 'timestamp'>) => void;
  removeRoute: (id: string) => void;
  renameRoute: (id: string, newName: string) => void;
}

export const useSavedRoutes = create<SavedRoutesState>()(
  persist(
    (set) => ({
      routes: [],
      addRoute: (route) =>
        set((state) => {
          const id = Date.now().toString();
          return {
            routes: [...state.routes, { ...route, id, timestamp: Date.now() }],
          };
        }),
      removeRoute: (id) =>
        set((state) => ({
          routes: state.routes.filter((r) => r.id !== id),
        })),
      renameRoute: (id, newName) =>
        set((state) => ({
          routes: state.routes.map((r) =>
            r.id === id ? { ...r, name: newName } : r
          ),
        })),
    }),
    {
      name: 'pedal-anatolia-saved-routes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
