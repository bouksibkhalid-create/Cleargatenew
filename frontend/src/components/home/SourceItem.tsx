import type { Source } from '../../data/dataSourcesData';

export function SourceItem({ flag, name, badge, description, features, link }: Source) {
    return (
        <div className="flex flex-col gap-3 pb-6 mb-6 border-b border-gray-200 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{flag}</span>
                    <h4 className="text-base font-semibold text-gray-900">{name}</h4>
                </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

            <ul className="flex flex-col gap-2">
                {features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 pl-6 relative">
                        <span className="absolute left-2 text-teal-500">•</span>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>
    );
}
