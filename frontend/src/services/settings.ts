import api from './api';

export interface SystemSettings {
    app_url?: string;
    host?: string;
    port?: string;
    user?: string;
    pass?: string;
    secure?: string; // 'true' or 'false'
    tls_reject?: string; // 'true' or 'false'
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
