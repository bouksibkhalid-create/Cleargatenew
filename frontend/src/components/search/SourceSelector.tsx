/**
 * Source selector component
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { SourceType } from '../../types/search';

interface SourceSelectorProps {
    value: SourceType[];
    onChange: (sources: SourceType[]) => void;
}

export default function SourceSelector({ value, onChange }: SourceSelectorProps) {
    const handleChange = (source: SourceType, checked: boolean) => {
        if (checked) {
            onChange([...value, source]);
        } else {
            // Ensure at least one source is selected
            const newSources = value.filter((s) => s !== source);
            if (newSources.length > 0) {
                onChange(newSources);
            }
        }
    };

    return (
        <div>
            <label className="text-xs text-muted-foreground mb-2 block">
                Data Sources
            </label>
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="opensanctions"
                        checked={value.includes('opensanctions')}
                        onCheckedChange={(checked) => handleChange('opensanctions', checked as boolean)}
                    />
                    <Label
                        htmlFor="opensanctions"
                        className="text-sm font-normal cursor-pointer"
                        title="Comprehensive open-source sanctions database"
                    >
                        OpenSanctions
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="sanctions_io"
                        checked={value.includes('sanctions_io')}
                        onCheckedChange={(checked) => handleChange('sanctions_io', checked as boolean)}
                    />
                    <Label
                        htmlFor="sanctions_io"
                        className="text-sm font-normal cursor-pointer"
                        title="Real-time sanctions screening database"
                    >
                        Sanctions.io
                    </Label>
                </div>
            </div>
        </div>
    );
}
