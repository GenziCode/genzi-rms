import api from '@/lib/api';
import type { User } from '@/types';

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

export const userService = {
    // Update user profile
    async updateProfile(data: UpdateProfileRequest) {
        const response = await api.put<{ data: User }>('/users/profile', data);
        return response.data.data;
    },

    // Get user profile (if different from auth/me)
    async getProfile() {
        const response = await api.get<{ data: User }>('/users/profile');
        return response.data.data;
    },
};
