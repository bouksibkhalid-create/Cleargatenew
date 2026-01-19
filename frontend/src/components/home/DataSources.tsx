import { Card, CardContent, CardHeader } from '../ui/card';
import { Globe, Sparkles } from 'lucide-react';
import { SourceList } from './SourceList';
import { officialSources, alternativeSources } from '../../data/dataSourcesData';

export function DataSources() {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Sanctions Data Sources
                    </h2>
                    <p className="text-base text-gray-600 max-w-3xl mx-auto">
                        Our searches rely on the following official lists and trusted alternative sources.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                    {/* Official Sources Card */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-teal-600" />
                                Official Sanctions List Sources
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Free and public sources</p>
                        </CardHeader>
                        <CardContent>
                            <SourceList sources={officialSources} />
                        </CardContent>
                    </Card>

                    {/* Alternative Sources Card */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-600" />
                                Alternative Aggregator Sources
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Complementary solutions</p>
                        </CardHeader>
                        <CardContent>
                            <SourceList sources={alternativeSources} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
