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
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-500 cursor-wait">
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
          ? 'bg-[#9E59EF]/10 text-[#9E59EF] border border-[#9E59EF]/30 hover:bg-[#9E59EF]/20'
          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
