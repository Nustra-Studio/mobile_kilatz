import * as SecureStore from 'expo-secure-store';
import { getDeviceId } from './deviceInfo';

const BASE_URL = 'https://backend-kilatz.nustrastudio.my.id/api';

/**
 * Build common headers for API requests
 */
async function buildHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    // Always include device ID for tracking
    const deviceId = await getDeviceId();
    headers['X-Device-ID'] = deviceId;

    // Include auth token if required
    if (includeAuth) {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

/**
 * Handle API errors and throw appropriate messages
 */
function handleError(response: Response, errorData: any) {
    if (response.status === 401) {
        // Unauthorized - token expired or invalid
        throw new Error(errorData.message || 'Unauthenticated. Please login again.');
    } else if (response.status === 422) {
        // Validation error
        const errors = errorData.errors || {};
        const firstError = Object.values(errors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : errorData.message || 'Validation error');
    } else if (response.status === 500) {
        // Server error
        throw new Error(errorData.message || 'Server error occurred');
    } else {
        throw new Error(errorData.message || 'API request failed');
    }
}

export const api = {
    /**
     * POST request
     */
    async post(endpoint: string, data: any, includeAuth: boolean = true) {
        const headers = await buildHeaders(includeAuth);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            handleError(response, errorData);
        }

        return response.json();
    },

    /**
     * GET request
     */
    async get(endpoint: string, includeAuth: boolean = true) {
        const headers = await buildHeaders(includeAuth);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            handleError(response, errorData);
        }

        return response.json();
    },

    /**
     * PUT request
     */
    async put(endpoint: string, data: any, includeAuth: boolean = true) {
        const headers = await buildHeaders(includeAuth);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            handleError(response, errorData);
        }

        return response.json();
    },

    /**
     * DELETE request
     */
    async delete(endpoint: string, includeAuth: boolean = true) {
        const headers = await buildHeaders(includeAuth);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            handleError(response, errorData);
        }

        return response.json();
    },

    /**
     * POST with timeout — rejects after `ms` milliseconds
     * Used for transactions so UI doesn't block forever
     */
    async postWithTimeout(endpoint: string, data: any, timeoutMs: number = 3000, includeAuth: boolean = true) {
        const headers = await buildHeaders(includeAuth);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                handleError(response, errorData);
            }

            return response.json();
        } catch (err: any) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                throw new Error('TIMEOUT');
            }
            throw err;
        }
    }
};
