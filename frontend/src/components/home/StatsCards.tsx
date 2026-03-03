import { StatsCard } from './StatsCard';
import { Database, Users, Building2, Ship, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statsData } from '../../data/statsData';

export function StatsCards() {
    const { t } = useTranslation();
    return (
        <section className="py-8 bg-white dark:bg-[#0F1419]">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                    <StatsCard
                        icon={<Database className="w-6 h-6" />}
                        iconBg="bg-blue-500/15"
                        iconColor="text-blue-400"
                        number={statsData.databases_count}
                        label={t('stats.sanctionsDatabases')}
                    />

                    <StatsCard
                        icon={<Users className="w-6 h-6" />}
                        iconBg="bg-blue-500/15"
                        iconColor="text-blue-400"
                        number={statsData.sanctioned_individuals}
                        label={t('stats.sanctionedIndividuals')}
                    />

                    <StatsCard
                        icon={<Building2 className="w-6 h-6" />}
                        iconBg="bg-purple-500/15"
                        iconColor="text-purple-400"
                        number={statsData.sanctioned_entities}
                        label={t('stats.sanctionedOrganizations')}
                    />

                    <StatsCard
                        icon={<Ship className="w-6 h-6" />}
                        iconBg="bg-indigo-500/15"
                        iconColor="text-indigo-400"
                        number={statsData.sanctioned_vehicles}
                        label={t('stats.sanctionedVehicles')}
                    />

                    <StatsCard
                        icon={<Globe className="w-6 h-6" />}
                        iconBg="bg-amber-500/15"
                        iconColor="text-amber-400"
                        number={statsData.sources_count}
                        label={t('stats.sanctionsListsCount')}
                    />
                </div>
            </div>
        </section>
    );
}
