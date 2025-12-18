import api from './api';

export interface SystemSettings {
    app_url?: string;
    host?: string;
    port?: string;
    user?: string;
    pass?: string;
    secure?: string; // 'true' or 'false'
    tls_reject?: string; // 'true' or 'false'
    sender_name?: string;
    cleanup_enabled?: string; // 'true' or 'false'
    cleanup_retention_days?: string;
    [key: string]: string | undefined;
}

export const getSettings = async () => {
    const response = await api.get<SystemSettings>('/settings');
    return response.data;
};

export const saveSettings = async (settings: SystemSettings) => {
    const response = await api.post('/settings', settings);
    return response.data;
};

export const sendTestEmail = async (to: string) => {
    const response = await api.post('/settings/test-email', { to });
    return response.data;
};

export interface ApiKey {
    id: string;
    name: string;
    key?: string; // Only present on creation
    lastUsed: string | null;
    createdAt: string;
    rawKey?: string;
}

export const getApiKeys = async () => {
    const response = await api.get<ApiKey[]>('/api-keys');
    return response.data;
};

export const createApiKey = async (name: string) => {
    const response = await api.post<ApiKey>('/api-keys', { name });
    return response.data;
};

export const deleteApiKey = async (id: string) => {
    await api.delete(`/api-keys/${id}`);
};

// Backend Logs
export interface BackendLog {
    id: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    source: string;
    message: string;
    details: string | null;
    createdAt: string;
}

export const getBackendLogs = async (params?: { level?: string; source?: string; limit?: number }) => {
    const response = await api.get<BackendLog[]>('/logs/backend', { params });
    return response.data;
};

export const clearOldLogs = async () => {
    const response = await api.delete('/logs/backend');
    return response.data;
};

// System Info
export interface SystemInfo {
    backend: {
        node: string;
        express: string;
        prisma: string;
        typescript: string;
        nodemailer: string;
        helmet: string;
        jsonwebtoken: string;
        bcryptjs: string;
        nodeCron: string;
    };
    frontend: {
        react: string;
        reactDom: string;
        mui: string;
        reactRouter: string;
        axios: string;
        vite: string;
        typescript: string;
    } | null;
    system: {
        platform: string;
        arch: string;
        uptime: number;
        memoryUsage: number;
    };
}

export const getSystemInfo = async () => {
    const response = await api.get<SystemInfo>('/settings/info');
    return response.data;
};
