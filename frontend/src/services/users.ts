import api from './api';

export interface User {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

export const getUsers = async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const createUser = async (data: { email: string; password: string; role: string }) => {
    const response = await api.post<User>('/users', data);
    return response.data;
};
