import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { rolesService, type Role } from '@/services/roles.service';
import { usersService } from '@/services/users.service';
import { Spinner } from '@/components/ui/spinner';

interface UserRoleAssignmentProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserRoleAssignment({
  userId,
  isOpen,
  onClose,
}: UserRoleAssignmentProps) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => rolesService.getUserRoles(userId),
    enabled: isOpen && !!userId,
  });

  const { data: allRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.getAll(),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { roleId: string; expiresAt?: Date }) => {
      await rolesService.assignRoleToUser(userId, data.roleId, data.expiresAt);
    },
    onSuccess: () => {
      toast.success('Role assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-for-assignments'] });
      setSelectedRoleId('');
      setExpiresAt('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to assign role');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (roleId: string) => rolesService.removeRoleFromUser(userId, roleId),
    onSuccess: () => {
      toast.success('Role removed successfully');
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-for-assignments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to remove role');
    },
  });

  const assignedRoleIds = new Set(userRoles?.roles.map((r) => r.id) || []);
  const availableRoles = allRoles?.roles.filter((r) => !assignedRoleIds.has(r.id)) || [];

  const handleAssign = () => {
    if (!selectedRoleId) {
      toast.error('Please select a role');
      return;
    }

    assignMutation.mutate({
      roleId: selectedRoleId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Assign Roles</h3>
                  <p className="text-sm text-gray-500">Manage user role assignments</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Assigned Roles */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Assigned Roles</h4>
                {userRoles?.roles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No roles assigned
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userRoles?.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            <div className="text-xs text-gray-500">
                              <code>{role.code}</code>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMutation.mutate(role.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={removeMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Role */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Assign New Role</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Role
                    </label>
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a role...</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for permanent assignment
                    </p>
                  </div>

                  <button
                    onClick={handleAssign}
                    disabled={!selectedRoleId || assignMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assignMutation.isPending ? (
                      <>
                        <Spinner size="sm" className="text-white" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Assign Role
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

