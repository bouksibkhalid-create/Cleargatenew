import React from 'react';



export function StatsCard({ icon, iconBg, iconColor, number, label }: { icon: React.ReactNode; iconBg: string; iconColor: string; number: number | string; label: string; }) {
    return (
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-6 transition-all hover:bg-white/[0.08] hover:-translate-y-0.5">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${iconBg}`}>
                <div className={iconColor}>
                    {icon}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-gray-400">{label}</div>
                <div className="text-2xl font-bold text-white leading-none">{number.toLocaleString()}</div>
            </div>
        </div>
    );
}
