export default function StaticGlobe({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full max-w-[400px] opacity-60">
        {/* Globe circle */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#1a2332" strokeWidth="1" />
        <ellipse cx="100" cy="100" rx="80" ry="30" fill="none" stroke="#1a2332" strokeWidth="0.5" />
        <ellipse cx="100" cy="100" rx="30" ry="80" fill="none" stroke="#1a2332" strokeWidth="0.5" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#1a2332" strokeWidth="0.5" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#1a2332" strokeWidth="0.5" />
        {/* Dots */}
        {[
          [60, 55], [140, 65], [90, 130], [120, 85], [70, 100],
          [150, 110], [50, 80], [130, 140], [80, 45], [110, 155],
          [45, 120], [155, 75], [100, 60], [75, 145], [135, 50],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill="#9E59EF" opacity={0.6} />
        ))}
        {/* Arcs */}
        <path d="M60,55 Q100,20 140,65" fill="none" stroke="#9E59EF" strokeWidth="0.8" opacity="0.4" />
        <path d="M90,130 Q130,90 150,110" fill="none" stroke="#9E59EF" strokeWidth="0.8" opacity="0.4" />
        <path d="M70,100 Q100,60 120,85" fill="none" stroke="#9E59EF" strokeWidth="0.8" opacity="0.4" />
      </svg>
    </div>
  )
}
