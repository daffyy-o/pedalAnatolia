import { create } from 'zustand';

interface PreferencesState {
  avoidSchoolZonesDuringPeakHours: boolean;
  setAvoidSchoolZones: (avoid: boolean) => void;
}

export const usePreferences = create<PreferencesState>((set) => ({
  avoidSchoolZonesDuringPeakHours: false,
  setAvoidSchoolZones: (avoid) => set({ avoidSchoolZonesDuringPeakHours: avoid }),
}));
