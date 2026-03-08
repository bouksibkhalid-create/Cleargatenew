import { Check } from 'lucide-react';
import type { OrderStatus, StatusEvent } from '../../types/order';

interface OrderStatusTimelineProps {
  statusHistory: StatusEvent[];
  currentStatus: OrderStatus;
  tier: 'investigation' | 'due_diligence';
}

const ALL_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: 'received', label: 'Commande reçue' },
  { status: 'data_collection', label: 'Collecte de données' },
  { status: 'analysis', label: 'Analyse en cours' },
  { status: 'analyst_review', label: 'Revue analyste' },
  { status: 'completed', label: 'Rapport disponible' },
];

export default function OrderStatusTimeline({ statusHistory, currentStatus, tier }: OrderStatusTimelineProps) {
  // Filter out analyst_review for investigation tier
  const steps = tier === 'investigation'
    ? ALL_STATUSES.filter((s) => s.status !== 'analyst_review')
    : ALL_STATUSES;

  const historyMap = new Map(statusHistory.map((h) => [h.status, h]));
  const currentIdx = steps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const event = historyMap.get(step.status);
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;

        const formattedDate = event
          ? new Date(event.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
          : '';

        return (
          <div key={step.status} className="flex items-start">
            <div className="flex flex-col items-center min-w-[100px]">
              {/* Dot */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-[#10B981] text-white'
                    : isCurrent
                      ? 'bg-[#00D4AA] text-white ring-4 ring-[#00D4AA]/20 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-[11px] text-center leading-tight max-w-[90px] ${
                  isCurrent
                    ? 'font-bold text-[#00D4AA]'
                    : isCompleted
                      ? 'font-medium text-slate-600 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>

              {/* Timestamp */}
              {formattedDate && (
                <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {isCompleted ? '✓' : '●'} {formattedDate}
                </span>
              )}
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mt-3.5 flex-shrink-0 ${
                  i < currentIdx ? 'bg-[#10B981]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
