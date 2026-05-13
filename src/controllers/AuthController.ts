import * as SecureStore from 'expo-secure-store';
import { api } from '../utils/api';
import { getDeviceInfo } from '../utils/deviceInfo';

interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    employee: {
        id: number;
        name: string;
        tenant_id: number;
        outlet_id: number;
    };
    tenant_id: number;
    outlet_id: number;
    role: string;
}

export const AuthController = {
    /**
     * Login with username and pin code
     * Captures device information and sends to API
     */
    async login(username: string, pinCode: string, outletId?: number): Promise<LoginResponse> {
        try {
            // Get device information
            const deviceInfo = await getDeviceInfo();

            // Prepare login payload according to API documentation
            const payload = {
                login_type: 'employee',
                username: username,
                pin_code: pinCode,
                outlet_id: outletId ?? null,
                device_id: deviceInfo.device_id,
                device_model: deviceInfo.device_model,
                device_os: deviceInfo.device_os,
            };

            // Call login API (no auth required for login endpoint)
            const data: LoginResponse = await api.post('/v1/login', payload, false);

            if (data.access_token) {
                // Store authentication tokens
                await SecureStore.setItemAsync('access_token', data.access_token);
                if (data.refresh_token) {
                    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
                }

                // Store user role
                await SecureStore.setItemAsync('user_role', data.role || 'CASHIER');

                // Store tenant and outlet IDs for global context
                await SecureStore.setItemAsync('tenant_id', String(data.tenant_id || ''));
                await SecureStore.setItemAsync('outlet_id', String(data.outlet_id || ''));

                // Store employee data
                await SecureStore.setItemAsync('employee_data', JSON.stringify(data.employee || {}));

                return data;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            return !!token;
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    },

    /**
     * Logout - calls API endpoint and clears local storage
     */
    async logout(): Promise<void> {
        try {
            // Call logout API endpoint
            await api.post('/v1/logout', {}, true);
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with local cleanup even if API call fails
        } finally {
            // Clear all stored authentication data
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            await SecureStore.deleteItemAsync('user_role');
            await SecureStore.deleteItemAsync('tenant_id');
            await SecureStore.deleteItemAsync('outlet_id');
            await SecureStore.deleteItemAsync('employee_data');
        }
    },

    /**
     * Get stored tenant ID
     */
    async getTenantId(): Promise<number | null> {
        const tenantId = await SecureStore.getItemAsync('tenant_id');
        return tenantId ? parseInt(tenantId) : null;
    },

    /**
     * Get stored outlet ID
     */
    async getOutletId(): Promise<number | null> {
        const outletId = await SecureStore.getItemAsync('outlet_id');
        return outletId ? parseInt(outletId) : null;
    },

    /**
     * Register a new employee account
     */
    async register(payload: {
        outlet_id: number;
        name: string;
        username: string;
        pin_code: string;
        role: 'CASHIER' | 'SUPERVISOR' | 'OWNER';
    }): Promise<{ message: string }> {
        try {
            const deviceInfo = await getDeviceInfo();
            const data = await api.post('/v1/register', {
                ...payload,
                device_id: deviceInfo.device_id,
                device_model: deviceInfo.device_model,
                device_os: deviceInfo.device_os,
            }, false);
            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },
};

