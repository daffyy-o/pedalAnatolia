import { create } from 'zustand';

interface PreferencesState {
  avoidSchoolZones: boolean;
  setAvoidSchoolZones: (avoid: boolean) => void;
  developerMode: boolean;
  setDeveloperMode: (on: boolean) => void;
}

export const usePreferences = create<PreferencesState>((set) => ({
  avoidSchoolZones: false,
  setAvoidSchoolZones: (avoid) => set({ avoidSchoolZones: avoid }),
  developerMode: false,
  setDeveloperMode: (on) => set({ developerMode: on }),
}));
