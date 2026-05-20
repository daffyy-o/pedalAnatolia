import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { boxAroundPoint, SchoolZoneFeature } from '../lib/schoolZones';

const STORAGE_KEY = 'pedal-school-zone-reports';

/** add = put a school on the map, remove = hide a red zone */
export type ReportType = 'add' | 'remove';
export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface SchoolZoneReport {
  id: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: number;
  note: string;
  lat?: number;
  lon?: number;
  zoneId?: string;
}

interface ZoneOverrides {
  added: SchoolZoneFeature[];
  removedIds: string[];
}

interface ReportsState {
  reports: SchoolZoneReport[];
  overrides: ZoneOverrides;
  load: () => Promise<void>;
  submitReport: (input: {
    type: ReportType;
    note: string;
    lat?: number;
    lon?: number;
    zoneId?: string;
  }) => Promise<void>;
  approveReport: (id: string) => void;
  rejectReport: (id: string) => void;
}

function normalizeType(type: string): ReportType {
  if (type === 'add' || type === 'remove') return type;
  if (type === 'missing') return 'add';
  return 'remove';
}

async function readStorage(): Promise<{ reports: SchoolZoneReport[]; overrides: ZoneOverrides }> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { reports: [], overrides: { added: [], removedIds: [] } };
  }
  const data = JSON.parse(raw);
  const reports = (data.reports || []).map((r: SchoolZoneReport) => ({
    ...r,
    type: normalizeType(r.type),
  }));
  return {
    reports,
    overrides: data.overrides || { added: [], removedIds: [] },
  };
}

async function save(reports: SchoolZoneReport[], overrides: ZoneOverrides) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ reports, overrides }));
}

export const useSchoolZoneReports = create<ReportsState>((set, get) => ({
  reports: [],
  overrides: { added: [], removedIds: [] },

  load: async () => {
    const data = await readStorage();
    set({ reports: data.reports, overrides: data.overrides });
  },

  submitReport: async (input) => {
    const report: SchoolZoneReport = {
      id: `report_${Date.now()}`,
      type: input.type,
      status: 'pending',
      createdAt: Date.now(),
      note: input.note.trim(),
      lat: input.lat,
      lon: input.lon,
      zoneId: input.zoneId,
    };
    const reports = [...get().reports, report];
    set({ reports });
    await save(reports, get().overrides);
  },

  approveReport: (id) => {
    const report = get().reports.find((r) => r.id === id);
    if (!report || report.status !== 'pending') return;

    const overrides = {
      added: [...get().overrides.added],
      removedIds: [...get().overrides.removedIds],
    };

    if (report.type === 'add' && report.lat != null && report.lon != null) {
      overrides.added.push({
        type: 'Feature',
        id: `zone_report_${report.id}`,
        properties: { name: report.note || 'Reported school' },
        geometry: {
          type: 'Polygon',
          coordinates: boxAroundPoint(report.lon, report.lat),
        },
      });
    }

    if (report.type === 'remove' && report.zoneId) {
      const zoneId = String(report.zoneId);
      if (!overrides.removedIds.includes(zoneId)) {
        overrides.removedIds.push(zoneId);
      }
      overrides.added = overrides.added.filter((z) => String(z.id) !== zoneId);
    }

    const reports = get().reports.map((r) =>
      r.id === id ? { ...r, status: 'approved' as const } : r
    );
    set({ reports, overrides });
    save(reports, overrides);
  },

  rejectReport: (id) => {
    const reports = get().reports.map((r) =>
      r.id === id ? { ...r, status: 'rejected' as const } : r
    );
    set({ reports });
    save(reports, get().overrides);
  },
}));
