import * as React from 'react';
import { Database, AlertTriangle, ShieldAlert } from 'lucide-react';
import { checkSupabaseHealth } from '@/lib/services/hall-service';

export async function DataSourceIndicator() {
  const health = await checkSupabaseHealth();

  if (health.mode === 'LIVE_SUPABASE') {
    return (
      <div
        role="status"
        className="bg-[#EBF3EE] border border-[#CDE3D5] rounded-md px-3 py-2 text-xs text-[#1A3B2B] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#1A3B2B] shrink-0" />
          <span>
            <strong>Live Supabase Connection:</strong> Hall records and schedule availability are verified via Supabase Postgres.
          </span>
        </div>
        <span className="font-mono text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded border border-[#CDE3D5] text-[#1A3B2B] self-start sm:self-auto shrink-0">
          SUPABASE LIVE
        </span>
      </div>
    );
  }

  if (health.mode === 'SUPABASE_SCHEMA_PENDING') {
    return (
      <div
        role="alert"
        className="bg-[#FEF3F2] border border-[#FECDCA] rounded-md px-3.5 py-2.5 text-xs text-[#912018] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div className="flex items-start sm:items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Database Migrations Pending:</strong> {health.message}
          </span>
        </div>
        <span className="font-mono text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-[#FECDCA] text-[#B42318] self-start sm:self-auto shrink-0">
          SCHEMA SETUP REQUIRED
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="bg-[#FFF8EB] border border-[#F5D998] rounded-md px-3 py-2 text-xs text-[#8C5800] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-[#8C5800] shrink-0" />
        <span>
          <strong>Development Sample Mode (Offline):</strong> Supabase credentials are not configured. Displaying clearly labeled sample venues and in-memory state.
        </span>
      </div>
      <span className="font-mono text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded border border-[#F5D998] text-[#8C5800] self-start sm:self-auto shrink-0">
        SAMPLE DATA
      </span>
    </div>
  );
}
