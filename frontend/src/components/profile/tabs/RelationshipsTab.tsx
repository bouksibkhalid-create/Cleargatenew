import { useState } from 'react';
import { Network, List, AlertTriangle } from 'lucide-react';
import type { EntityProfile } from '../../../types/profile';
import EmptyState from '../shared/EmptyState';
import StatusBanner from '../shared/StatusBanner';
import { ReactFlowProvider } from 'reactflow';
import InteractiveGraph from '../../graph/InteractiveGraph';

interface RelationshipsTabProps {
  profile: EntityProfile;
}

type ViewMode = 'graph' | 'list';

export default function RelationshipsTab({ profile }: RelationshipsTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const offshoreResults = profile.offshore_results ?? [];
  const connectionsCount = offshoreResults.length;

  if (connectionsCount === 0) {
    return (
      <EmptyState
        icon={Network}
        title="No Offshore Connections Found"
        description="This entity was not found in the ICIJ Offshore Leaks database (Panama Papers, Paradise Papers, Pandora Papers, Offshore Leaks)."
      />
    );
  }

  // Try to find a numeric node_id from the first offshore result
  const firstResult = offshoreResults[0] ?? {};
  const nodeId = firstResult.node_id ?? firstResult.id ?? '';

  return (
    <div className="space-y-6">
      {/* Connection Summary */}
      <StatusBanner
        status="found"
        icon={Network}
        title={`${connectionsCount} CONNECTION${connectionsCount !== 1 ? 'S' : ''} FOUND`}
        subtitle="ICIJ Offshore Leaks Databases"
      />

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('graph')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'graph'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Network className="w-4 h-4" /> Graph View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <List className="w-4 h-4" /> List View
        </button>
      </div>

      {/* Content */}
      {viewMode === 'graph' ? (
        <GraphViewSection nodeId={String(nodeId)} entityName={profile.entity.name} />
      ) : (
        <ListViewSection results={offshoreResults} />
      )}
    </div>
  );
}

function GraphViewSection({ nodeId, entityName }: { nodeId: string; entityName: string }) {
  if (!nodeId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          No graph node ID available for this entity. Use the list view to see connections.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 500 }}>
      <ReactFlowProvider>
        <InteractiveGraph initialEntityId={nodeId} initialEntityName={entityName} />
      </ReactFlowProvider>
    </div>
  );
}

function ListViewSection({ results }: { results: Record<string, any>[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Connected Entity
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Jurisdiction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {r.name || r.label || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.node_type || r.type || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.jurisdiction || r.country || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
