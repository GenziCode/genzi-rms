import api from '@/lib/api';

export interface Plan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    limits: {
        users: number;
        storage: number; // in MB
        products: number;
        orders: number;
    };
}

export interface Subscription {
    id: string;
    planId: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    plan: Plan;
}

export interface Usage {
    users: { used: number; limit: number };
    storage: { used: number; limit: number };
    products: { used: number; limit: number };
    orders: { used: number; limit: number };
}

export interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'open' | 'void' | 'uncollectible';
    date: string;
    pdfUrl: string;
}

export const subscriptionService = {
    // Get current subscription
    async getCurrentSubscription() {
        const response = await api.get<{ data: Subscription }>('/subscription/current');
        return response.data.data;
    },

    // Get available plans
    async getPlans() {
        const response = await api.get<{ data: Plan[] }>('/subscription/plans');
        return response.data.data;
    },

    // Get usage statistics
    async getUsage() {
        const response = await api.get<{ data: Usage }>('/subscription/usage');
        return response.data.data;
    },

    // Get billing history
    async getInvoices() {
        const response = await api.get<{ data: Invoice[] }>('/subscription/invoices');
        return response.data.data;
    },

    // Update subscription (upgrade/downgrade)
    async updateSubscription(planId: string, interval: 'month' | 'year') {
        const response = await api.post<{ data: Subscription }>('/subscription/update', {
            planId,
            interval,
        });
        return response.data.data;
    },

    // Cancel subscription
    async cancelSubscription() {
        const response = await api.post<{ data: Subscription }>('/subscription/cancel');
        return response.data.data;
    },

    // Reactivate subscription
    async reactivateSubscription() {
        const response = await api.post<{ data: Subscription }>('/subscription/reactivate');
        return response.data.data;
    },
};
