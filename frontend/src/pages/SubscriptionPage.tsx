import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreditCard,
    Check,
    AlertTriangle,
    Download,
    Loader2,
    Package,
    Users,
    HardDrive,
    ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    subscriptionService,
    type Plan,
} from '@/services/subscription.service';
import { formatCurrency } from '@/lib/utils';

export default function SubscriptionPage() {
    const queryClient = useQueryClient();
    const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>(
        'month'
    );

    // Fetch current subscription
    const { data: subscription, isLoading: subLoading } = useQuery({
        queryKey: ['subscription'],
        queryFn: () => subscriptionService.getCurrentSubscription(),
    });

    // Fetch plans
    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: () => subscriptionService.getPlans(),
    });

    // Fetch usage
    const { data: usage, isLoading: usageLoading } = useQuery({
        queryKey: ['usage'],
        queryFn: () => subscriptionService.getUsage(),
    });

    // Fetch invoices
    const { data: invoices, isLoading: invoicesLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => subscriptionService.getInvoices(),
    });

    // Update subscription mutation
    const updateMutation = useMutation({
        mutationFn: (planId: string) =>
            subscriptionService.updateSubscription(planId, selectedInterval),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            toast.success('Subscription updated successfully!');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || 'Failed to update subscription'
            );
        },
    });

    // Cancel mutation
    const cancelMutation = useMutation({
        mutationFn: () => subscriptionService.cancelSubscription(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            toast.success('Subscription cancelled successfully');
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || 'Failed to cancel subscription'
            );
        },
    });

    const isLoading =
        subLoading || plansLoading || usageLoading || invoicesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const currentPlanId = subscription?.planId;

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Subscription & Billing
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage your plan, usage, and billing history
                </p>
            </div>

            {/* Current Plan & Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Plan Card */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Current Plan
                    </h2>
                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-600 font-semibold text-lg">
                                {subscription?.plan.name}
                            </span>
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${subscription?.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                            >
                                {subscription?.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {formatCurrency(subscription?.plan.price || 0)}
                            <span className="text-sm font-normal text-gray-500">
                                /{subscription?.plan.interval}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Renews on{' '}
                            {new Date(
                                subscription?.currentPeriodEnd || ''
                            ).toLocaleDateString()}
                        </p>
                    </div>

                    {subscription?.cancelAtPeriodEnd ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-900">
                                        Subscription Cancelled
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Your access will end on{' '}
                                        {new Date(
                                            subscription?.currentPeriodEnd || ''
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                if (
                                    confirm(
                                        'Are you sure you want to cancel? You will lose access at the end of the billing period.'
                                    )
                                ) {
                                    cancelMutation.mutate();
                                }
                            }}
                            disabled={cancelMutation.isPending}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                            Cancel Subscription
                        </button>
                    )}
                </div>

                {/* Usage Stats */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Resource Usage
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Users */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Users
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {usage?.users.used} / {usage?.users.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(
                                            ((usage?.users.used || 0) / (usage?.users.limit || 1)) *
                                            100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Products
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {usage?.products.used} / {usage?.products.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(
                                            ((usage?.products.used || 0) /
                                                (usage?.products.limit || 1)) *
                                            100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Storage */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Storage (MB)
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {usage?.storage.used} / {usage?.storage.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(
                                            ((usage?.storage.used || 0) /
                                                (usage?.storage.limit || 1)) *
                                            100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Orders */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Orders / Month
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {usage?.orders.used} / {usage?.orders.limit}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-orange-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(
                                            ((usage?.orders.used || 0) /
                                                (usage?.orders.limit || 1)) *
                                            100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Plans */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Available Plans</h2>
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setSelectedInterval('month')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition ${selectedInterval === 'month'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedInterval('year')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition ${selectedInterval === 'year'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Yearly (Save 20%)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans?.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-xl shadow-lg border-2 p-6 flex flex-col ${currentPlanId === plan.id
                                    ? 'border-blue-600 ring-4 ring-blue-50'
                                    : 'border-transparent hover:border-gray-200'
                                }`}
                        >
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(
                                            selectedInterval === 'year'
                                                ? plan.price * 12 * 0.8
                                                : plan.price
                                        )}
                                    </span>
                                    <span className="text-gray-500">/{selectedInterval}</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => updateMutation.mutate(plan.id)}
                                disabled={
                                    currentPlanId === plan.id || updateMutation.isPending
                                }
                                className={`w-full py-3 rounded-lg font-semibold transition ${currentPlanId === plan.id
                                        ? 'bg-gray-100 text-gray-500 cursor-default'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {currentPlanId === plan.id
                                    ? 'Current Plan'
                                    : updateMutation.isPending
                                        ? 'Processing...'
                                        : 'Upgrade'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Billing History
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Invoice
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoices?.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {formatCurrency(invoice.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${invoice.status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={invoice.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                                        >
                                            <Download className="w-4 h-4" />
                                            PDF
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {(!invoices || invoices.length === 0) && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-gray-500"
                                    >
                                        No invoices found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
