import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationComment {
  id: string;
  lat: number;
  lon: number;
  text: string;
  userName: string;
  createdAt: number;
}

interface LocationCommentsState {
  comments: LocationComment[];
  addComment: (input: { lat: number; lon: number; text: string; userName: string }) => void;
}

export const useLocationComments = create<LocationCommentsState>()(
  persist(
    (set) => ({
      comments: [],
      addComment: (input) =>
        set((state) => ({
          comments: [
            ...state.comments,
            {
              id: `comment_${Date.now()}`,
              lat: input.lat,
              lon: input.lon,
              text: input.text.trim(),
              userName: input.userName,
              createdAt: Date.now(),
            },
          ],
        })),
    }),
    {
      name: 'pedal-anatolia-location-comments',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

