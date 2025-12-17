import api from './api';

export interface Template {
    id: string;
    title: string;
    internalName: string;
    introText: string;
    logoUrl: string;
    htmlDesign: string;
    emailSubject: string;
    emailBody: string;
    commentLabel?: string;
    submitButtonLabel?: string;
    questions: { id: string; text: string }[];
}

export const getTemplates = async () => {
    const response = await api.get<Template[]>('/templates');
    return response.data;
};

export const createTemplate = async (data: Omit<Template, 'id' | 'questions'> & { questions: string[] }) => {
    const response = await api.post<Template>('/templates', data);
    return response.data;
};

export const updateTemplate = async (id: string, data: Omit<Template, 'id' | 'questions'> & { questions: string[] }) => {
    const response = await api.put<Template>(`/templates/${id}`, data);
    return response.data;
};

export const deleteTemplate = async (id: string) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
};
