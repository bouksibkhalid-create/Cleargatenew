interface SentimentIndicatorProps {
  sentiment: 'negative' | 'neutral' | 'mixed' | string;
}

const SENTIMENT_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  negative: { emoji: '🔴', label: 'Negative', color: 'text-red-600' },
  neutral: { emoji: '⚪', label: 'Neutral', color: 'text-gray-500' },
  mixed: { emoji: '🟡', label: 'Mixed', color: 'text-amber-600' },
};

export default function SentimentIndicator({ sentiment }: SentimentIndicatorProps) {
  const info = SENTIMENT_MAP[sentiment] ?? SENTIMENT_MAP.neutral;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${info.color}`}>
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </span>
  );
}
