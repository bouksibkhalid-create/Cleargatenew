import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ReportDownloadButtonProps {
  /** The full M5 EntityProfile object (or the reportProfile adapter output). */
  profile: Record<string, any>;
  language?: 'fr' | 'en';
  variant?: 'primary' | 'secondary';
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export default function ReportDownloadButton({
  profile,
  language = 'fr',
  variant = 'primary',
}: ReportDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      console.log('[Report] Requesting server-side PDF generation…');

      const res = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          language,
          classification: 'CONFIDENTIEL',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `Server error ${res.status}`);
      }

      // Extract filename from Content-Disposition or generate one
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `ClearGate_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      console.log('[Report] Download triggered:', filename);
    } catch (error: any) {
      console.error('Report generation error:', error);
      const msg = error?.message || String(error);
      alert(`Failed to generate report: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const baseClasses =
    variant === 'primary'
      ? 'bg-[#9E59EF] text-white hover:bg-[#8A3FE0]'
      : 'bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20';

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className={`rounded-full px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${baseClasses}`}
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Generate Report
        </>
      )}
    </button>
  );
}
