import { Shield, Users, FileText } from 'lucide-react';

interface HitSummaryCardsProps {
  sanctionsHits: number;
  pepHits: number;
  adverseNewsCount: number;
}

export default function HitSummaryCards({ sanctionsHits, pepHits, adverseNewsCount }: HitSummaryCardsProps) {
  const cards = [
    {
      icon: Shield,
      count: sanctionsHits,
      label: 'Sanctions Hits',
      activeColor: 'text-red-600',
    },
    {
      icon: Users,
      count: pepHits,
      label: 'PEP Hits',
      activeColor: 'text-amber-600',
    },
    {
      icon: FileText,
      count: adverseNewsCount,
      label: 'Adverse News',
      activeColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-gray-200 p-6 text-center flex flex-col items-center justify-center"
        >
          <card.icon className="w-6 h-6 text-gray-400 mb-3" />
          <span
            className={`text-3xl font-bold ${
              card.count > 0 ? card.activeColor : 'text-gray-900'
            }`}
          >
            {card.count}
          </span>
          <span className="text-xs text-gray-500 mt-1">{card.label}</span>
        </div>
      ))}
    </div>
  );
}
