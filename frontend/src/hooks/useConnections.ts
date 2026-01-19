/**
 * Custom hook for fetching graph connections
 */

import { useState, useCallback } from 'react';
import { apiClient, APIError } from '../services/api';
import type { ConnectionRequest, ConnectionResponse } from '../types/graph';

interface UseConnectionsReturn {
    data: ConnectionResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchConnections: (nodeId: number, depth?: number, maxNodes?: number) => Promise<void>;
    reset: () => void;
}

export function useConnections(): UseConnectionsReturn {
    const [data, setData] = useState<ConnectionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConnections = useCallback(
        async (nodeId: number, depth: number = 2, maxNodes: number = 50) => {
            setIsLoading(true);
            setError(null);

            try {
                const request: ConnectionRequest = {
                    node_id: nodeId,
                    depth,
                    max_nodes: maxNodes,
                };

                const result = await apiClient.getConnections(request);
                setData(result);
            } catch (err) {
                if (err instanceof APIError) {
                    setError(err.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Failed to fetch connections');
                }
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return { data, isLoading, error, fetchConnections, reset };
}
