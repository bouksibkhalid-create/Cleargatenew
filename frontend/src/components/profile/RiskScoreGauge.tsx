interface RiskScoreGaugeProps {
  score: number;
  riskColor: string;
}

export default function RiskScoreGauge({ score, riskColor }: RiskScoreGaugeProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const progressLength = arcLength * (score / 100);

  return (
    <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-4">
        Risk Score
      </p>

      <div className="relative w-48 h-48">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor" className="text-slate-200 dark:text-white/10"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(135, 60, 60)"
          />
          {/* Progress arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={riskColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${circumference}`}
            transform="rotate(135, 60, 60)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: riskColor }}>
            {score}
          </span>
          <span className="text-sm text-slate-500 dark:text-gray-500">out of 100</span>
        </div>
      </div>
    </div>
  );
}
