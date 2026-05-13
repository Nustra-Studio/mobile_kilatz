import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface Employee {
    id: number;
    name: string;
    tenant_id: number;
    outlet_id: number;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    tenantId: number | null;
    outletId: number | null;
    employee: Employee | null;
    role: string | null;
    refreshAuth: () => Promise<void>;
    setAuthData: (data: {
        tenantId: number;
        outletId: number;
        employee: Employee;
        role: string;
    }) => void;
    clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tenantId, setTenantId] = useState<number | null>(null);
    const [outletId, setOutletId] = useState<number | null>(null);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [role, setRole] = useState<string | null>(null);

    const refreshAuth = async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');

            if (token) {
                const storedTenantId = await SecureStore.getItemAsync('tenant_id');
                const storedOutletId = await SecureStore.getItemAsync('outlet_id');
                const storedRole = await SecureStore.getItemAsync('user_role');
                const storedEmployee = await SecureStore.getItemAsync('employee_data');

                setIsAuthenticated(true);
                setTenantId(storedTenantId ? parseInt(storedTenantId) : null);
                setOutletId(storedOutletId ? parseInt(storedOutletId) : null);
                setRole(storedRole);

                if (storedEmployee) {
                    try {
                        setEmployee(JSON.parse(storedEmployee));
                    } catch (e) {
                        console.error('Error parsing employee data:', e);
                    }
                }
            } else {
                setIsAuthenticated(false);
                setTenantId(null);
                setOutletId(null);
                setEmployee(null);
                setRole(null);
            }
        } catch (error) {
            console.error('Error refreshing auth:', error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const setAuthData = (data: {
        tenantId: number;
        outletId: number;
        employee: Employee;
        role: string;
    }) => {
        setIsAuthenticated(true);
        setTenantId(data.tenantId);
        setOutletId(data.outletId);
        setEmployee(data.employee);
        setRole(data.role);
    };

    const clearAuth = () => {
        setIsAuthenticated(false);
        setTenantId(null);
        setOutletId(null);
        setEmployee(null);
        setRole(null);
    };

    useEffect(() => {
        refreshAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                tenantId,
                outletId,
                employee,
                role,
                refreshAuth,
                setAuthData,
                clearAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
