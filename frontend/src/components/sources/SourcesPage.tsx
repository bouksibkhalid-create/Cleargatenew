import { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import CgCard from '../common/CgCard';

const DATA_SOURCES = [
  { flag: '🇺🇸', name: 'OFAC SDN', count: '18,557', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇪🇺', name: 'EU Consolidated', count: '5,833', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇺🇳', name: 'UN Security Council', count: '999', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇬🇧', name: 'UK OFSI', count: '5,135', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🇨🇦', name: 'Canada SEMA', count: '3,105', status: 'healthy', statusLabel: 'Healthy', freshness: '1 day ago' },
  { flag: '🌐', name: 'OpenSanctions', count: 'Live API', status: 'online', statusLabel: 'Online', freshness: 'Real-time' },
  { flag: '📄', name: 'ICIJ Offshore Leaks', count: '800K+', status: 'static', statusLabel: 'Static', freshness: 'Imported' },
  { flag: '🔗', name: 'Neo4j Graph', count: '2M+ nodes', status: 'online', statusLabel: 'Connected', freshness: '2.9M rels' },
];

const STATUS_COLORS: Record<string, string> = {
  healthy: '#10B981',
  online: '#3B82F6',
  static: '#6B7280',
  stale: '#F59E0B',
  error: '#EF4444',
};

const SYNC_HISTORY = [
  { date: 'Mar 2, 2026 03:00', status: 'ok', entities: '33,629', duration: '42s' },
  { date: 'Feb 23, 2026 03:00', status: 'ok', entities: '33,614', duration: '39s' },
  { date: 'Feb 16, 2026 03:00', status: 'partial', entities: '33,590', duration: '51s', note: 'UK OFSI: timeout (other 5 succeeded)' },
  { date: 'Feb 9, 2026 03:00', status: 'ok', entities: '33,571', duration: '38s' },
];

export default function SourcesPage() {
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 3000);
  };

  return (
    <div>
      <PageHeader
        icon={<Database className="w-6 h-6 text-[#00D4AA]" />}
        title="Sources"
        subtitle="Sanctions databases and data freshness"
      />

      {/* Update Status */}
      <CgCard className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-medium text-[#111827]">All sources healthy</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#6B7280]">
              <span>Last sync: <strong className="text-[#111827]">March 2, 2026 at 03:00 UTC</strong></span>
              <span>Next scheduled: <strong className="text-[#111827]">March 9, 2026</strong></span>
              <span>Total entities: <strong className="text-[#111827]">33,629</strong></span>
              <span>Sources active: <strong className="text-[#111827]">6/6</strong></span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#00D4AA] text-[#0F1419] rounded-lg hover:bg-[#00BF9A] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Run Manual Sync'}
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-[#E5E7EB] text-[#6B7280] rounded-lg hover:text-[#111827] hover:bg-gray-50 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              View Sync Logs
            </button>
          </div>
        </div>
      </CgCard>

      {/* Data Sources section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[#E5E7EB]" />
        <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Data Sources</span>
        <div className="h-px flex-1 bg-[#E5E7EB]" />
      </div>

      {/* Source Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {DATA_SOURCES.map((ds) => (
          <div
            key={ds.name}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md hover:border-[#00D4AA]/30 transition-all"
          >
            <div className="text-2xl mb-3">{ds.flag}</div>
            <h4 className="text-sm font-semibold text-[#111827] mb-1">{ds.name}</h4>
            <div className="text-lg font-bold text-[#111827] mb-2">{ds.count}</div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: STATUS_COLORS[ds.status] || '#6B7280' }}
              />
              <span className="text-xs text-[#6B7280] font-medium">{ds.statusLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
              <Clock className="w-3 h-3" />
              {ds.freshness}
            </div>
          </div>
        ))}
      </div>

      {/* Sync History section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[#E5E7EB]" />
        <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Sync History</span>
        <div className="h-px flex-1 bg-[#E5E7EB]" />
      </div>

      {/* Sync History Table */}
      <CgCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Entities</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody>
              {SYNC_HISTORY.map((row, i) => (
                <tr key={i} className="border-b border-[#E5E7EB] last:border-b-0">
                  <td className="px-4 py-3 text-[#111827]">{row.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {row.status === 'ok' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                      )}
                      <span className={row.status === 'ok' ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                        {row.status === 'ok' ? 'OK' : 'Partial'}
                      </span>
                    </span>
                    {row.note && (
                      <div className="text-[11px] text-[#9CA3AF] mt-0.5 ml-5">{row.note}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{row.entities}</td>
                  <td className="px-4 py-3 text-[#6B7280]">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CgCard>
    </div>
  );
}
