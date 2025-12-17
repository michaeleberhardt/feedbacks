import api from './api';

export interface EmailLog {
    id: string;
    recipient: string;
    subject: string;
    status: 'SUCCESS' | 'ERROR';
    errorDetails?: string;
    createdAt: string;
    surveyId?: string;
}

export const getEmailLogs = async () => {
    const response = await api.get<EmailLog[]>('/logs/email');
    return response.data;
};
