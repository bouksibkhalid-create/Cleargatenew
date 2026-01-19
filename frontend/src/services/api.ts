/**
 * API client for backend communication (Enhanced for Module 3)
 */

import axios, { type AxiosInstance, AxiosError } from 'axios';
import type { SearchRequest, SearchResponse, ErrorResponse } from '../types/search';
import type { ConnectionRequest, ConnectionResponse } from '../types/graph';

class APIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: import.meta.env.VITE_API_URL || '/api',
            timeout: 15000,  // Increased for multiple sources
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ErrorResponse>) => {
                if (error.response?.data) {
                    // Server returned an error response
                    throw new APIError(
                        error.response.data.message,
                        error.response.status,
                        error.response.data.error
                    );
                } else if (error.request) {
                    // Request was made but no response
                    throw new APIError(
                        'No response from server. Please check your connection.',
                        0,
                        'NetworkError'
                    );
                } else {
                    // Something else happened
                    throw new APIError(
                        error.message,
                        0,
                        'UnknownError'
                    );
                }
            }
        );
    }

    async search(request: SearchRequest): Promise<SearchResponse> {
        const response = await this.client.post<SearchResponse>(
            '/search',
            request
        );
        return response.data;
    }

    async getConnections(request: ConnectionRequest): Promise<ConnectionResponse> {
        const response = await this.client.post<ConnectionResponse>(
            '/connections',
            request
        );
        return response.data;
    }
}

export class APIError extends Error {
    statusCode: number;
    errorType: string;

    constructor(
        message: string,
        statusCode: number,
        errorType: string
    ) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.errorType = errorType;
    }
}

export const apiClient = new APIClient();

