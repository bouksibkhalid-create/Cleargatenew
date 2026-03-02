interface MatchTypeBadgeProps {
  type: 'exact' | 'potential' | string;
}

export default function MatchTypeBadge({ type }: MatchTypeBadgeProps) {
  const isExact = type === 'exact';
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <span className={isExact ? 'text-red-500' : 'text-gray-500'}>
        {isExact ? '●' : '○'}
      </span>
      <span className={isExact ? 'text-red-400' : 'text-gray-400'}>
        {isExact ? 'Exact' : 'Potential'}
      </span>
    </span>
  );
}
