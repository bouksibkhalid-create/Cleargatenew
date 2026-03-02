import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface MonitorToggleProps {
  entityName: string;
  entityData?: Record<string, unknown>;
}

export default function MonitorToggle({ entityName, entityData }: MonitorToggleProps) {
  const [isMonitored, setIsMonitored] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityName) return;
    setLoading(true);
    fetch(`${API_URL}/api/monitor?entity_name=${encodeURIComponent(entityName)}`)
      .then((r) => r.json())
      .then((data) => setIsMonitored(data.is_monitored ?? false))
      .catch(() => setIsMonitored(false))
      .finally(() => setLoading(false));
  }, [entityName]);

  async function toggle() {
    setLoading(true);
    try {
      const endpoint = isMonitored ? '/api/monitor/remove' : '/api/monitor/add';
      await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_name: entityName, entity_data: entityData }),
      });
      setIsMonitored(!isMonitored);
    } catch {
      // Silently fail for demo
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-400 cursor-wait">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking…
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isMonitored
          ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      {isMonitored ? (
        <>
          <Eye className="w-4 h-4" />
          Monitoring Active
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4" />
          Enable Monitoring
        </>
      )}
    </button>
  );
}
