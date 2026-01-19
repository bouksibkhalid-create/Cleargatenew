/**
 * Dialog for displaying connection graph
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ConnectionGraph from '../graph/ConnectionGraph';
import { useConnections } from '../../hooks/useConnections';

interface GraphDialogProps {
    open: boolean;
    onClose: () => void;
    nodeId: number | null;
    nodeName?: string;
}

export default function GraphDialog({ open, onClose, nodeId, nodeName }: GraphDialogProps) {
    const [isMaximized, setIsMaximized] = useState(false);
    const { data, isLoading, error, fetchConnections, reset } = useConnections();

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            reset();
            setIsMaximized(false);
        }
    }, [open, reset]);

    // Fetch data when dialog opens and nodeId is present
    useEffect(() => {
        if (open && nodeId) {
            fetchConnections(nodeId);
        }
    }, [open, nodeId, fetchConnections]);

    const handleToggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className={isMaximized ? "max-w-[100vw] h-[100vh] w-full" : "max-w-6xl h-[80vh]"}>
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle>Connection Graph</DialogTitle>
                            {nodeName && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Centering on: {nodeName}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleMaximize}
                                aria-label="maximize"
                            >
                                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="relative h-full overflow-hidden p-0">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full bg-muted/50">
                            <div className="text-center">
                                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    Loading connections...
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-6">
                            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <p className="text-sm text-red-900">{error}</p>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && data && (
                        <div className="w-full h-full">
                            <ConnectionGraph
                                data={data.graph}
                                onNodeClick={(id: string) => {
                                    // Start a new search/traversal if clicked on a different node
                                    console.log('Node clicked:', id);
                                    if (parseInt(id) !== nodeId) {
                                        fetchConnections(parseInt(id));
                                    }
                                }}
                            />

                            {/* Stats Overlay */}
                            <div className="absolute top-3 left-3 bg-background p-3 rounded-md shadow-md z-10 opacity-90">
                                <p className="text-xs font-semibold mb-1">Graph Stats</p>
                                <p className="text-xs">Nodes: {data.graph.node_count}</p>
                                <p className="text-xs">Edges: {data.graph.edge_count}</p>
                                <p className="text-xs">Depth: {data.graph.depth}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
