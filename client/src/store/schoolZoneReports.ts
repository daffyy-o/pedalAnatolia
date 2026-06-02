import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { boxAroundPoint, SchoolZoneFeature } from '../lib/schoolZones';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_KEY = 'pedal-school-zone-reports';
const TABLE_NAME = 'school_zone_reports';

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
  startRemoteSync: () => () => void;
  submitReport: (input: {
    type: ReportType;
    note: string;
    lat?: number;
    lon?: number;
    zoneId?: string;
  }) => Promise<void>;
  approveReport: (id: string) => Promise<void>;
  rejectReport: (id: string) => Promise<void>;
}

interface SchoolZoneReportRow {
  id: string;
  type: string;
  status: string;
  created_at: number;
  note: string | null;
  lat: number | null;
  lon: number | null;
  zone_id: string | null;
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

function reportToRow(report: SchoolZoneReport) {
  return {
    id: report.id,
    type: report.type,
    status: report.status,
    created_at: report.createdAt,
    note: report.note,
    lat: report.lat ?? null,
    lon: report.lon ?? null,
    zone_id: report.zoneId ?? null,
  };
}

function rowToReport(row: SchoolZoneReportRow): SchoolZoneReport {
  return {
    id: row.id,
    type: normalizeType(row.type),
    status:
      row.status === 'approved' || row.status === 'rejected' || row.status === 'pending'
        ? row.status
        : 'pending',
    createdAt: row.created_at,
    note: row.note || '',
    lat: row.lat ?? undefined,
    lon: row.lon ?? undefined,
    zoneId: row.zone_id ?? undefined,
  };
}

function buildOverrides(reports: SchoolZoneReport[]): ZoneOverrides {
  const overrides: ZoneOverrides = { added: [], removedIds: [] };

  for (const report of reports) {
    if (report.status !== 'approved') continue;

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
  }

  return overrides;
}

async function readRemoteReports() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  const reports = ((data || []) as SchoolZoneReportRow[]).map(rowToReport);
  return { reports, overrides: buildOverrides(reports) };
}

export const useSchoolZoneReports = create<ReportsState>((set, get) => ({
  reports: [],
  overrides: { added: [], removedIds: [] },

  load: async () => {
    let data = await readStorage();
    if (isSupabaseConfigured) {
      try {
        const remote = await readRemoteReports();
        if (remote) data = remote;
      } catch (error) {
        console.warn('Supabase load failed, using local school-zone cache.', error);
      }
    }
    set({ reports: data.reports, overrides: data.overrides });
    await save(data.reports, data.overrides);
  },

  startRemoteSync: () => {
    const client = supabase;
    if (!client) return () => {};

    const channel = client
      .channel('school-zone-report-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        get().load();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
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
    const overrides = buildOverrides(reports);
    set({ reports, overrides });
    await save(reports, overrides);

    if (supabase) {
      const { error } = await supabase.from(TABLE_NAME).insert(reportToRow(report));
      if (error) {
        console.warn('Supabase submit failed, report is saved locally.', error);
      }
    }
  },

  approveReport: async (id) => {
    const report = get().reports.find((r) => r.id === id);
    if (!report || report.status !== 'pending') return;

    const reports = get().reports.map((r) =>
      r.id === id ? { ...r, status: 'approved' as const } : r
    );
    const overrides = buildOverrides(reports);
    set({ reports, overrides });
    await save(reports, overrides);

    if (supabase) {
      const { error } = await supabase.from(TABLE_NAME).update({ status: 'approved' }).eq('id', id);
      if (error) {
        console.warn('Supabase approval failed, approval is saved locally.', error);
      }
    }
  },

  rejectReport: async (id) => {
    const reports = get().reports.map((r) =>
      r.id === id ? { ...r, status: 'rejected' as const } : r
    );
    const overrides = buildOverrides(reports);
    set({ reports, overrides });
    await save(reports, overrides);

    if (supabase) {
      const { error } = await supabase.from(TABLE_NAME).update({ status: 'rejected' }).eq('id', id);
      if (error) {
        console.warn('Supabase rejection failed, rejection is saved locally.', error);
      }
    }
  },
}));
