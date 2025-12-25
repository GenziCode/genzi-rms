import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Store as StoreIcon,
    X,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { storesService, Store, CreateStoreRequest } from '@/services/stores.service';

export default function StoresPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);

    const [formData, setFormData] = useState<CreateStoreRequest>({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        settings: {
            timezone: 'UTC',
            currency: 'USD',
            taxRate: 0
        }
    });

    // Fetch stores
    const { data: stores, isLoading, error } = useQuery({
        queryKey: ['stores'],
        queryFn: storesService.getAll,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: storesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success('Store created successfully!');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create store');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateStoreRequest> }) =>
            storesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success('Store updated successfully!');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update store');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: storesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success('Store deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete store');
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            email: '',
            phone: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            settings: {
                timezone: 'UTC',
                currency: 'USD',
                taxRate: 0
            }
        });
        setEditingStore(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStore) {
            updateMutation.mutate({ id: editingStore._id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (store: Store) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            code: store.code,
            email: store.email || '',
            phone: store.phone || '',
            address: {
                street: store.address?.street || '',
                city: store.address?.city || '',
                state: store.address?.state || '',
                zipCode: store.address?.zipCode || '',
                country: store.address?.country || ''
            },
            settings: {
                timezone: store.settings?.timezone || 'UTC',
                currency: store.settings?.currency || 'USD',
                taxRate: store.settings?.taxRate || 0
            }
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const filteredStores = stores?.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <p className="text-red-600">Failed to load stores</p>
                <button onClick={() => queryClient.invalidateQueries({ queryKey: ['stores'] })} className="mt-4 text-blue-600 hover:underline">Retry</button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
                    <p className="text-gray-600 mt-1">Manage your physical store locations</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Store
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search stores..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => (
                    <div key={store._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                    <StoreIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{store.name}</h3>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{store.code}</span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEdit(store)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(store._id, store.name)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                            {store.address?.city && (
                                <div className="flex items-start">
                                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>
                                        {store.address.street}, {store.address.city}, {store.address.state} {store.address.zipCode}
                                    </span>
                                </div>
                            )}
                            {store.phone && (
                                <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>{store.phone}</span>
                                </div>
                            )}
                            {store.email && (
                                <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>{store.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingStore ? 'Edit Store' : 'Add Store'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                        <input
                                            type="text"
                                            value={formData.address?.street}
                                            onChange={e => setFormData({ ...formData, address: { ...formData.address!, street: e.target.value } })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.address?.city}
                                            onChange={e => setFormData({ ...formData, address: { ...formData.address!, city: e.target.value } })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.address?.state}
                                            onChange={e => setFormData({ ...formData, address: { ...formData.address!, state: e.target.value } })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                        <input
                                            type="text"
                                            value={formData.address?.zipCode}
                                            onChange={e => setFormData({ ...formData, address: { ...formData.address!, zipCode: e.target.value } })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={formData.address?.country}
                                            onChange={e => setFormData({ ...formData, address: { ...formData.address!, country: e.target.value } })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingStore ? 'Save Changes' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
