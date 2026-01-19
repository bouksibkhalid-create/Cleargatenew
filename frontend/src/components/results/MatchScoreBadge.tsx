/**
 * Match score badge component
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MatchScoreBadgeProps {
    score: number;
}

export default function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
    const getVariant = () => {
        if (score === 100) return 'default'; // Green for exact match
        if (score >= 90) return 'secondary'; // Blue for high match
        if (score >= 80) return 'outline'; // Outlined for medium match
        return 'outline'; // Default for lower scores
    };

    const getLabel = () => {
        if (score === 100) return 'Exact Match';
        return `${score}% Match`;
    };

    return (
        <Badge
            variant={getVariant()}
            className={cn(
                "font-semibold",
                score === 100 && "bg-green-100 text-green-800 hover:bg-green-100",
                score >= 90 && score < 100 && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                score >= 80 && score < 90 && "bg-amber-100 text-amber-800 hover:bg-amber-100"
            )}
        >
            {getLabel()}
        </Badge>
    );
}
