import { Card, CardContent, CardHeader } from '../ui/card';
import { StatusItem } from './StatusItem';
import { updateSources } from '../../data/updateStatusData';

export function UpdateStatus() {
    return (
        <section className="py-12 bg-[#0F1419]">
            <div className="container mx-auto px-4">
                <Card className="max-w-7xl mx-auto bg-[#1A1F2E] border-white/10 text-white">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Update Status</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-green-400">Live</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col">
                            {updateSources.map((source) => (
                                <StatusItem key={source.id} {...source} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
