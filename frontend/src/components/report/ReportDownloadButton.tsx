import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateReport } from './ReportGenerator';
import type { ReportEntityProfile } from './types/reportData';
import type { ReportTheme } from './types/theme';
import { clearGateTheme } from './themes/cleargate';

interface ReportDownloadButtonProps {
  profile: ReportEntityProfile;
  theme?: ReportTheme;
  variant?: 'primary' | 'secondary';
}

export default function ReportDownloadButton({
  profile,
  theme = clearGateTheme,
  variant = 'primary',
}: ReportDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateReport(profile, theme);
    } catch (error) {
      if (error instanceof RangeError) {
        alert('Report too large to generate. Try reducing graph depth.');
      } else {
        alert('Failed to generate report. Please try again.');
        console.error('Report generation error:', error);
      }
    } finally {
      setGenerating(false);
    }
  };

  const baseClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50';

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
