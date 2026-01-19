import { StatsCard } from './StatsCard';
import { Database, Users, Building2, Ship, Globe } from 'lucide-react';
import { statsData } from '../../data/statsData';

export function StatsCards() {
    return (
        <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                    <StatsCard
                        icon={<Database className="w-6 h-6" />}
                        iconBg="bg-blue-100"
                        iconColor="text-blue-600"
                        number={statsData.databases_count}
                        label="Sanctions databases"
                    />

                    <StatsCard
                        icon={<Users className="w-6 h-6" />}
                        iconBg="bg-teal-100"
                        iconColor="text-teal-600"
                        number={statsData.sanctioned_individuals}
                        label="Sanctioned individuals"
                    />

                    <StatsCard
                        icon={<Building2 className="w-6 h-6" />}
                        iconBg="bg-purple-100"
                        iconColor="text-purple-600"
                        number={statsData.sanctioned_entities}
                        label="Sanctioned organizations"
                    />

                    <StatsCard
                        icon={<Ship className="w-6 h-6" />}
                        iconBg="bg-indigo-100"
                        iconColor="text-indigo-600"
                        number={statsData.sanctioned_vehicles}
                        label="Sanctioned vehicles"
                    />

                    <StatsCard
                        icon={<Globe className="w-6 h-6" />}
                        iconBg="bg-orange-100"
                        iconColor="text-orange-600"
                        number={statsData.sources_count}
                        label="Sanctions lists"
                    />
                </div>
            </div>
        </section>
    );
}
