import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, User, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersService } from '@/services/users.service';
import type { User as UserType, UserRole } from '@/types/user.types';

interface UserFormModalProps {
  user?: UserType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'cashier' as UserRole,
    phone: user?.phone || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => user ? usersService.update(user._id, data) : usersService.create(data),
    onSuccess: () => {
      toast.success(user ? 'User updated' : 'User created');
      onSuccess();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to save user'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requestData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
    };

    if (!user) {
      requestData.email = formData.email;
      requestData.password = formData.password;
      requestData.role = formData.role;
    }

    mutation.mutate(requestData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">{user ? 'Edit User' : 'Add User'}</h2>
          </div>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Min 8 characters, include uppercase, lowercase, and number</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="kitchen_staff">Kitchen Staff</option>
                  <option value="waiter">Waiter</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : user ? 'Update' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

