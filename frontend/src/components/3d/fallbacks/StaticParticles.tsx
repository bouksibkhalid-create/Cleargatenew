export default function StaticParticles({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Particles */}
        {[
          [50, 80], [120, 40], [200, 120], [280, 60], [350, 150],
          [420, 30], [480, 100], [540, 70], [90, 160], [170, 90],
          [250, 180], [330, 50], [400, 130], [460, 170], [520, 45],
          [60, 30], [140, 150], [220, 20], [300, 110], [380, 80],
          [440, 55], [500, 140], [560, 100], [30, 130], [100, 110],
        ].map(([cx, cy], i) => (
          <circle key={`p-${i}`} cx={cx} cy={cy} r="2.5" fill="#4B5563" opacity={0.6}>
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* Connections */}
        {[
          [50, 80, 120, 40], [120, 40, 200, 120], [280, 60, 350, 150],
          [420, 30, 480, 100], [90, 160, 170, 90], [330, 50, 400, 130],
          [60, 30, 140, 150], [300, 110, 380, 80], [440, 55, 500, 140],
          [200, 120, 280, 60], [480, 100, 540, 70], [170, 90, 250, 180],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={`l-${i}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#00D4AA" strokeWidth="0.5" opacity={0.15}
          >
            <animate attributeName="opacity" values="0.05;0.2;0.05" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
          </line>
        ))}
      </svg>
    </div>
  )
}
