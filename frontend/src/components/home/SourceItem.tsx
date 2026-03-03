import type { Source } from '../../data/dataSourcesData';

export function SourceItem({ flag, name, description, features }: Source) {
    return (
        <div className="flex flex-col gap-3 pb-6 mb-6 border-b border-slate-200 dark:border-white/10 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{flag}</span>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">{name}</h4>
                </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">{description}</p>

            <ul className="flex flex-col gap-2">
                {features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-slate-500 dark:text-gray-400 pl-6 relative">
                        <span className="absolute left-2 text-blue-500">•</span>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>
    );
}
