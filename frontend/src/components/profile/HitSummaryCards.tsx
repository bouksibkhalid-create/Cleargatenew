import { Shield, Users, FileText } from 'lucide-react';

interface HitSummaryCardsProps {
  sanctionsHits: number;
  pepHits: number;
  adverseNewsCount: number;
  onSanctionsClick?: () => void;
  onPepClick?: () => void;
  onAdverseClick?: () => void;
}

export default function HitSummaryCards({ sanctionsHits, pepHits, adverseNewsCount, onSanctionsClick, onPepClick, onAdverseClick }: HitSummaryCardsProps) {
  const cards = [
    {
      icon: Shield,
      count: sanctionsHits,
      label: 'Sanctions Hits',
      activeColor: 'text-red-600',
      onClick: onSanctionsClick,
    },
    {
      icon: Users,
      count: pepHits,
      label: 'PEP Hits',
      activeColor: 'text-amber-600',
      onClick: onPepClick,
    },
    {
      icon: FileText,
      count: adverseNewsCount,
      label: 'Adverse News',
      activeColor: 'text-amber-600',
      onClick: onAdverseClick,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {cards.map((card) => (
        <div
          key={card.label}
          onClick={card.onClick}
          role={card.onClick ? 'button' : undefined}
          tabIndex={card.onClick ? 0 : undefined}
          onKeyDown={card.onClick ? (e) => { if (e.key === 'Enter') card.onClick?.(); } : undefined}
          className={`bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6 text-center flex flex-col items-center justify-center${card.onClick ? ' cursor-pointer hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 transition-all' : ''}`}
        >
          <card.icon className="w-6 h-6 text-slate-400 dark:text-gray-500 mb-3" />
          <span
            className={`text-3xl font-bold ${
              card.count > 0 ? card.activeColor : 'text-slate-900 dark:text-white'
            }`}
          >
            {card.count}
          </span>
          <span className="text-xs text-slate-500 dark:text-gray-400 mt-1">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
