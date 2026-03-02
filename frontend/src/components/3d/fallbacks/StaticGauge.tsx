export default function StaticGauge({
  score = 50,
  label = 'MEDIUM',
  className = '',
}: {
  score?: number
  label?: string
  className?: string
}) {
  const riskColor = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#10B981'
  const angle = Math.PI * (1 - score / 100)
  const needleX = 100 + 60 * Math.cos(angle)
  const needleY = 110 - 60 * Math.sin(angle)

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 130" className="w-full max-w-[300px]">
        {/* Arc background */}
        <path
          d="M 30 110 A 70 70 0 0 1 170 110"
          fill="none"
          stroke="#1F2937"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Arc gradient overlay */}
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <path
          d="M 30 110 A 70 70 0 0 1 170 110"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Needle */}
        <line
          x1="100"
          y1="110"
          x2={needleX}
          y2={needleY}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="100" cy="110" r="4" fill="white" />
      </svg>
      <div className="flex flex-col items-center -mt-2">
        <span className="text-3xl font-bold text-white tabular-nums">{score}</span>
        <span
          className="text-xs font-semibold tracking-widest uppercase mt-1"
          style={{ color: riskColor }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
