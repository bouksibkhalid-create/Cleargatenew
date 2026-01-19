import { SourceItem } from './SourceItem';
import type { Source } from '../../data/dataSourcesData';

interface SourceListProps {
    sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
    return (
        <div className="flex flex-col">
            {sources.map((source) => (
                <SourceItem key={source.id} {...source} />
            ))}
        </div>
    );
}
