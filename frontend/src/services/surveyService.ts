import api from './api';

export interface Survey {
    id: string;
    reference: string;
    employee: string;
    addresseeEmail: string;
    status: 'open' | 'answered';
    createdAt: string;
    template?: {
        id: string;
        introText: string;
        title?: string;
        questions?: { id: string; text: string }[];
    };
    averageScore?: number;
    comment?: string;
    answers?: { questionId: string; value: number }[];
}

export const getSurveys = async (params?: { ref?: string; employee?: string; status?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get<Survey[]>('/surveys', { params });
    return response.data;
};

export const getSurveyStats = async (params?: { ref?: string; employee?: string }) => {
    const response = await api.get<{ year: number; quarter: number; month: number }>('/surveys/stats', { params });
    return response.data;
};

export const createSurvey = async (data: { templateId: string; reference: string; employee: string; addresseeEmail: string }) => {
    const response = await api.post<Survey>('/surveys', data);
    return response.data;
};

export const getPublicSurvey = async (id: string) => {
    const response = await api.get(`/surveys/${id}/public`);
    return response.data;
};

export const submitSurvey = async (id: string, data: { answers: Record<string, number>; comment: string }) => {
    const response = await api.post(`/surveys/${id}/submit`, data);
    return response.data;
};

export const retriggerSurvey = async (id: string) => {
    const response = await api.post(`/surveys/${id}/retrigger`);
    return response.data;
};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data.url;
};
