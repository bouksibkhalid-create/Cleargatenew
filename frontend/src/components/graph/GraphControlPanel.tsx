/**
 * Graph Control Panel
 * Provides controls for force simulation and graph manipulation
 */

import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GraphControlPanelProps {
    onRestart: () => void;
    onStop: () => void;
    onFitView: () => void;
    isSimulationRunning?: boolean;
}

export default function GraphControlPanel({
    onRestart,
    onStop,
    onFitView,
    isSimulationRunning = true
}: GraphControlPanelProps) {
    return (
        <Card className="absolute top-4 left-4 z-10 p-2 bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200">
            <div className="flex flex-col gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onFitView}
                    className="gap-2 justify-start"
                    title="Fit graph to view"
                >
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-xs">Fit View</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={isSimulationRunning ? onStop : onRestart}
                    className="gap-2 justify-start"
                    title={isSimulationRunning ? "Pause layout" : "Resume layout"}
                >
                    {isSimulationRunning ? (
                        <>
                            <Pause className="w-4 h-4" />
                            <span className="text-xs">Pause</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span className="text-xs">Resume</span>
                        </>
                    )}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRestart}
                    className="gap-2 justify-start"
                    title="Reset layout"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs">Reset</span>
                </Button>
            </div>
        </Card>
    );
}
