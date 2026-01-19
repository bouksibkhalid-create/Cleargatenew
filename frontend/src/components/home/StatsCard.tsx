import React from 'react';



export function StatsCard({ icon, iconBg, iconColor, number, label }: { icon: React.ReactNode; iconBg: string; iconColor: string; number: number | string; label: string; }) {
    return (
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${iconBg}`}>
                <div className={iconColor}>
                    {icon}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <div className="stat-label">{label}</div>
                <div className="stat-number">{number.toLocaleString()}</div>
            </div>
        </div>
    );
}
