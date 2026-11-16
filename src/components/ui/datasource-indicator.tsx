import * as React from 'react';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getDataSourceStatus } from '@/lib/services/hall-service';

export function DataSourceIndicator() {
  const status = getDataSourceStatus();

  if (status.isConfigured) {
    return (
      <div
        role="status"
        className="bg-[#EBF3EE] border border-[#CDE3D5] rounded-md px-3 py-1.5 text-xs text-[#1A3B2B] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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

  return (
    <div
      role="status"
      className="bg-[#FFF8EB] border border-[#F5D998] rounded-md px-3 py-1.5 text-xs text-[#8C5800] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-[#8C5800] shrink-0" />
        <span>
          <strong>Development Mode (Sample Data):</strong> Supabase credentials not set in environment. Set <code className="font-mono text-[11px] bg-white/70 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> to enable live database reads.
        </span>
      </div>
      <span className="font-mono text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded border border-[#F5D998] text-[#8C5800] self-start sm:self-auto shrink-0">
        SAMPLE STORE
      </span>
    </div>
  );
}
