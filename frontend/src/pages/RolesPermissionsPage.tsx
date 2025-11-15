import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Settings,
  BarChart3,
  UserCheck,
  Key,
  Activity,
  Crown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Filter,
  Grid,
  List,
  ChevronDown,
  MoreHorizontal,
  AlertTriangle,
  CheckSquare,
  Square,
  UserPlus,
  UserMinus,
  RefreshCw,
  Zap,
  TrendingUp,
  Database,
  FileText,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { rolesService, type Role } from '@/services/roles.service';
import {
  permissionsService,
  type Permission,
  type FormPermission,
  type FieldPermission,
} from '@/services/permissions.service';
import { usersService } from '@/services/users.service';
import type { User, UserListResponse } from '@/types/user.types';
import RoleFormModal from '@/components/roles/RoleFormModal';
import PermissionMatrix from '@/components/roles/PermissionMatrix';
import { Spinner } from '@/components/ui/spinner';
import { useHasPermission } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import UserRoleAssignment from '@/components/users/UserRoleAssignment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type ViewMode = 'grid' | 'list' | 'matrix';
type ActiveTab =
  | 'overview'
  | 'roles'
  | 'permissions'
  | 'assignments'
  | 'analytics';
type PolicyStatus = 'enabled' | 'paused' | 'draft';

const defaultPolicyPresets: Array<{
  id: string;
  title: string;
  description: string;
  status: PolicyStatus;
  kpi: string;
  owner: string;
}> = [
  {
    id: 'time-windows',
    title: 'Time-based access windows',
    description: 'Restrict back-office access to defined operating hours per region.',
    status: 'enabled',
    kpi: '4 windows active',
    owner: 'Security Ops',
  },
  {
    id: 'approval-chain',
    title: 'Approval chain enforcement',
    description: 'Require dual approval for roles that can void invoices or edit taxes.',
    status: 'paused',
    kpi: 'Ready for pilot',
    owner: 'Finance',
  },
  {
    id: 'delegation',
    title: 'Role delegation rules',
    description: 'Allow store managers to delegate POS roles for limited time.',
    status: 'draft',
    kpi: 'Policy draft v2',
    owner: 'People Ops',
  },
];

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState<User | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormPermission | null>(null);
  const [policyCards, setPolicyCards] = useState(defaultPolicyPresets);
  const [scopeDraft, setScopeDraft] = useState({
    region: 'global',
    baseline: 'all-stores',
    retention: 180,
    justification: '',
  });

  const cyclePolicyStatus = (status: PolicyStatus): PolicyStatus => {
    switch (status) {
      case 'enabled':
        return 'paused';
      case 'paused':
        return 'draft';
      default:
        return 'enabled';
    }
  };

  const handlePolicyToggle = (policyId: string) => {
    setPolicyCards((prev) =>
      prev.map((policy) =>
        policy.id === policyId
          ? { ...policy, status: cyclePolicyStatus(policy.status) }
          : policy
      )
    );
    toast.success('Policy status updated');
  };

  const getPolicyBadgeClasses = (status: PolicyStatus) => {
    switch (status) {
      case 'enabled':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const canManageRoles =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    useHasPermission('*') ||
    useHasPermission('role:*');

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.getAll(),
    enabled: canManageRoles,
  });

  // Fetch permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: () => permissionsService.getGroupedByModule(),
    enabled: canManageRoles,
  });

  // Fetch users for assignments
  const { data: usersData, isLoading: usersLoading } =
    useQuery<UserListResponse>({
      queryKey: ['users-for-assignments'],
      queryFn: () => usersService.getAll({ limit: 100 }),
      enabled: canManageRoles,
    });

  // Fetch form permissions grouped by category
  const {
    data: formPermissionsByCategory,
    isLoading: formPermissionsLoading,
  } = useQuery<Record<string, FormPermission[]>>({
    queryKey: ['form-permissions-categories'],
    queryFn: () => permissionsService.getFormsByCategory(),
    enabled: canManageRoles,
    staleTime: 300_000,
  });

  // Fetch field permissions for selected form
  const {
    data: fieldPermissionsData,
    isFetching: fieldPermissionsLoading,
  } = useQuery<{ fields: FieldPermission[] }>({
    queryKey: ['field-permissions', selectedForm?.formName],
    queryFn: () =>
      selectedForm
        ? permissionsService.getFieldsForForm(selectedForm.formName)
        : Promise.resolve({ fields: [] }),
    enabled: canManageRoles && Boolean(selectedForm),
    staleTime: 300_000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: rolesService.delete,
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || 'Failed to delete role'
      );
    },
  });

  const roles = rolesData?.roles || [];
  const permissions = permissionsData || {};
  const users: User[] = usersData?.users || [];

  // Filter roles
  const filteredRoles = useMemo(() => {
    let filtered = roles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((role) => role.category === selectedCategory);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (role.description &&
            role.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [roles, selectedCategory, searchTerm]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const totalRoles = roles.length;
    const activeRoles = roles.filter((r) => r.isActive).length;
    const systemRoles = roles.filter((r) => r.isSystemRole).length;
    const customRoles = totalRoles - systemRoles;

    const totalPermissions = Object.values(permissions).flat().length;
    const totalUsers = users.length;
    const assignedUsers = users.filter(
      (u) => u.role && u.role !== 'owner'
    ).length;

    return {
      totalRoles,
      activeRoles,
      systemRoles,
      customRoles,
      totalPermissions,
      totalUsers,
      assignedUsers,
      roleUtilization:
        totalUsers > 0 ? Math.round((assignedUsers / totalUsers) * 100) : 0,
    };
  }, [roles, permissions, users]);

  const roleDistribution = useMemo(() => {
    return roles.reduce<Record<string, number>>((acc, role) => {
      acc[role.category] = (acc[role.category] || 0) + 1;
      return acc;
    }, {});
  }, [roles]);

  const normalizeFormCollection = (raw: unknown): FormPermission[] => {
    if (Array.isArray(raw)) {
      return raw as FormPermission[];
    }
    if (raw && typeof raw === 'object') {
      const maybeForms = (raw as { forms?: unknown }).forms;
      if (Array.isArray(maybeForms)) {
        return maybeForms as FormPermission[];
      }
      return Object.values(raw as Record<string, unknown>).flatMap((value) =>
        Array.isArray(value)
          ? (value as FormPermission[])
          : Array.isArray((value as { forms?: unknown }).forms)
            ? ((value as { forms?: FormPermission[] }).forms ?? [])
            : []
      );
    }
    return [];
  };

  const formAnalytics = useMemo(() => {
    const categories = formPermissionsByCategory ?? {};
    const normalizedEntries = Object.entries(categories).reduce<
      Record<string, FormPermission[]>
    >((acc, [category, forms]) => {
      acc[category] = normalizeFormCollection(forms);
      return acc;
    }, {});

    const totalForms = Object.values(normalizedEntries).reduce(
      (sum, forms) => sum + forms.length,
      0
    );

    return {
      totalForms,
      categories: normalizedEntries,
    };
  }, [formPermissionsByCategory]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-200';
      case 'custom':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-200';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-200';
    }
  };

  const getRoleIcon = (role: Role) => {
    if (role.isSystemRole) return Crown;
    if (role.code?.toLowerCase().includes('admin')) return Shield;
    if (role.code?.toLowerCase().includes('manager')) return Settings;
    return Users;
  };

  const handleEdit = (role: Role) => {
    if (role.isSystemRole && user?.role !== 'owner') {
      toast.warning('System roles can only be edited by owners');
      return;
    }
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystemRole) {
      toast.warning('System roles cannot be deleted');
      return;
    }
    if (
      window.confirm(`Are you sure you want to delete role "${role.name}"?`)
    ) {
      deleteMutation.mutate(role.id);
    }
  };

  if (!canManageRoles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-red-700">
              You don't have permission to manage roles and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Contact your administrator to request access to role management
              features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Role & Permission Center
                </h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">
                  Comprehensive role management and access control system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Role
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as ActiveTab)}
              className="w-full"
            >
              <TabsList className="flex flex-wrap gap-2 w-full bg-transparent border-0 p-0">
                <TabsTrigger
                  value="overview"
                  className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="roles"
                  className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Roles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden sm:inline">Permissions</span>
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Assignments</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ActiveTab)}
          className="w-full"
        >
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-900">
                      Total Roles
                    </CardTitle>
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {analyticsData.totalRoles}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-blue-700">
                      {analyticsData.activeRoles} active
                    </div>
                    <div className="w-16 bg-blue-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{
                          width: `${analyticsData.totalRoles > 0 ? (analyticsData.activeRoles / analyticsData.totalRoles) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-900">
                      Permissions
                    </CardTitle>
                    <Key className="w-5 h-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {analyticsData.totalPermissions}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Across {Object.keys(permissions).length} modules
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-900">
                      User Coverage
                    </CardTitle>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    {analyticsData.roleUtilization}%
                  </div>
                  <Progress
                    value={analyticsData.roleUtilization}
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-purple-700 mt-2">
                    {analyticsData.assignedUsers} of {analyticsData.totalUsers}{' '}
                    users assigned
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-orange-900">
                      System Roles
                    </CardTitle>
                    <Crown className="w-5 h-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {analyticsData.systemRoles}
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                    {analyticsData.customRoles} custom roles
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab('roles')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Manage Roles</CardTitle>
                      <CardDescription>
                        Create, edit, and organize roles
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowPermissionMatrix(true)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Key className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Permission Matrix
                      </CardTitle>
                      <CardDescription>
                        View and manage permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab('assignments')}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        User Assignments
                      </CardTitle>
                      <CardDescription>Assign roles to users</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Policy & Scope Controls */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {policyCards.map((policy) => (
                <Card key={policy.id} className="border-slate-200">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">{policy.title}</CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getPolicyBadgeClasses(
                        policy.status
                      )}`}
                    >
                      {policy.status === 'draft'
                        ? 'Draft'
                        : policy.status === 'paused'
                        ? 'Paused'
                        : 'Enabled'}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-slate-600 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      {policy.kpi}
                    </div>
                    <div className="text-xs text-slate-500">
                      Owner: <span className="font-medium text-slate-700">{policy.owner}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePolicyToggle(policy.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Cycle Status
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Data scope controls</CardTitle>
                <CardDescription>
                  Define which stores, regions, and records each policy applies to. Changes sync to
                  API gateways automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Region</label>
                    <select
                      value={scopeDraft.region}
                      onChange={(e) =>
                        setScopeDraft((prev) => ({ ...prev, region: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="global">Global</option>
                      <option value="mena">MENA</option>
                      <option value="south-asia">South Asia</option>
                      <option value="custom">Custom selection</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Store coverage</label>
                    <select
                      value={scopeDraft.baseline}
                      onChange={(e) =>
                        setScopeDraft((prev) => ({ ...prev, baseline: e.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="all-stores">All stores</option>
                      <option value="hq-only">HQ only</option>
                      <option value="franchise">Franchise stores</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Retention (days)</label>
                    <input
                      type="number"
                      min={30}
                      max={365}
                      value={scopeDraft.retention}
                      onChange={(e) =>
                        setScopeDraft((prev) => ({
                          ...prev,
                          retention: Number(e.target.value),
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Change justification
                  </label>
                  <textarea
                    value={scopeDraft.justification}
                    onChange={(e) =>
                      setScopeDraft((prev) => ({ ...prev, justification: e.target.value }))
                    }
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                    placeholder="Document why scope is being updated..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Syncs with compliance audit trail
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setScopeDraft({
                          region: 'global',
                          baseline: 'all-stores',
                          retention: 180,
                          justification: '',
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={() => toast.success('Scope draft saved')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save Scope
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="system">System</option>
                      <option value="custom">Custom</option>
                    </select>
                    <div className="flex border border-gray-300 rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('matrix')}
                        className="rounded-l-none"
                      >
                        <Database className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roles Display */}
            {viewMode === 'matrix' ? (
              <PermissionMatrix
                permissions={permissions}
                roles={filteredRoles}
              />
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {rolesLoading ? (
                  <div className="col-span-full flex justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No roles found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedCategory !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Create your first role to get started'}
                    </p>
                    {!searchTerm && selectedCategory === 'all' && (
                      <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        Create Role
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredRoles.map((role) => {
                    const Icon = getRoleIcon(role);
                    return (
                      <Card
                        key={role.id}
                        className={`hover:shadow-lg transition-all duration-200 ${!role.isActive ? 'opacity-60' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${role.isSystemRole ? 'bg-yellow-100' : 'bg-blue-100'}`}
                              >
                                <Icon
                                  className={`w-5 h-5 ${role.isSystemRole ? 'text-yellow-600' : 'text-blue-600'}`}
                                />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {role.name}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    {role.code}
                                  </code>
                                  <Badge
                                    className={getCategoryColor(role.category)}
                                  >
                                    {role.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEdit(role)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Role
                                </DropdownMenuItem>
                                {!role.isSystemRole && (
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(role)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Role
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {role.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {role.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Key className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {role.permissions?.length || 0} permissions
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {role.isActive ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span
                                  className={
                                    role.isActive
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }
                                >
                                  {role.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            {role.isSystemRole && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                <Crown className="w-3 h-3 mr-1" />
                                System
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Permission Overview
                    </CardTitle>
                    <CardDescription>
                      All available permissions organized by module
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {permissionsLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(permissions).map(([module, perms]) => (
                          <div key={module} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {module}
                              </h4>
                              <Badge variant="outline">
                                {perms.length} permissions
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {perms.slice(0, 6).map((perm) => (
                                <div
                                  key={perm.code}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <CheckSquare className="w-4 h-4 text-green-500" />
                                  <span className="text-gray-700">
                                    {perm.name}
                                  </span>
                                </div>
                              ))}
                              {perms.length > 6 && (
                                <div className="text-sm text-gray-500">
                                  +{perms.length - 6} more permissions
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      onClick={() => setShowPermissionMatrix(true)}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      View Permission Matrix
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('roles')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Manage Roles
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Permission Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Permissions
                      </span>
                      <span className="font-semibold">
                        {analyticsData.totalPermissions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Modules</span>
                      <span className="font-semibold">
                        {Object.keys(permissions).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        System Permissions
                      </span>
                      <span className="font-semibold">
                        {
                          Object.values(permissions)
                            .flat()
                            .filter((p) => p.isSystem).length
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Form Permission Explorer
                  </CardTitle>
                  <CardDescription>
                    {formAnalytics.totalForms > 0
                      ? `${formAnalytics.totalForms} forms synced from Candela. Select a form to inspect controls.`
                      : 'Sync form registry to populate this list.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formPermissionsLoading ? (
                    <div className="flex justify-center py-10">
                      <Spinner size="lg" />
                    </div>
                  ) : formAnalytics.totalForms === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <EyeOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">
                        No forms have been synchronized yet. Run the RBAC sync
                        script or import form metadata.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(formAnalytics.categories).map(
                        ([category, forms]) => {
                          const formList = Array.isArray(forms) ? forms : [];
                          return (
                            <div
                              key={category}
                              className="rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900 capitalize">
                                  {category}
                                </span>
                                <Badge variant="secondary">
                                  {formList.length} forms
                                </Badge>
                              </div>
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {formList.slice(0, 4).map((form) => {
                                  const isActive =
                                    selectedForm?.formName === form.formName;
                                  return (
                                    <button
                                      key={form.formName}
                                      type="button"
                                      onClick={() => setSelectedForm(form)}
                                      className={`rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                        isActive
                                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                                          : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                      }`}
                                      aria-pressed={isActive}
                                    >
                                      <p className="text-sm font-semibold line-clamp-1">
                                        {form.formCaption || form.formName}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {form.formName}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                              {formList.length > 4 && (
                                <p className="mt-2 text-xs text-slate-500">
                                  +{formList.length - 4} additional forms in
                                  this category
                                </p>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Field Permission Detail
                  </CardTitle>
                  <CardDescription>
                    {selectedForm
                      ? `Controls for ${selectedForm.formCaption ?? selectedForm.formName}`
                      : 'Select a form on the left to inspect field visibility and edit rules.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedForm ? (
                    <>
                      <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Form Name</span>
                          <code>{selectedForm.formName}</code>
                        </div>
                        {selectedForm.route && (
                          <div className="flex items-center justify-between">
                            <span>Route</span>
                            <code>{selectedForm.route}</code>
                          </div>
                        )}
                        {selectedForm.httpMethods && (
                          <div className="flex items-center justify-between">
                            <span>Methods</span>
                            <span>{selectedForm.httpMethods.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      {fieldPermissionsLoading ? (
                        <div className="flex justify-center py-10">
                          <Spinner size="lg" />
                        </div>
                      ) : (fieldPermissionsData?.fields?.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                          <p className="text-sm text-slate-600">
                            No field metadata has been synced for this form yet.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-200">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left">
                              <tr>
                                <th className="px-3 py-2 font-medium text-slate-600">
                                  Control
                                </th>
                                <th className="px-3 py-2 font-medium text-slate-600">
                                  Visibility
                                </th>
                                <th className="px-3 py-2 font-medium text-slate-600">
                                  Editable
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {fieldPermissionsData?.fields?.map((field) => (
                                <tr
                                  key={`${field.formName}-${field.controlName}`}
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-3 py-2">
                                    <p className="font-medium text-slate-800">
                                      {field.label || field.controlName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {field.controlName}
                                    </p>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        field.isVisible
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : 'border-rose-200 bg-rose-50 text-rose-700'
                                      }
                                    >
                                      {field.isVisible ? 'Visible' : 'Hidden'}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        field.isEditable
                                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                                          : 'border-slate-200 bg-slate-50 text-slate-600'
                                      }
                                    >
                                      {field.isEditable ? 'Editable' : 'Read only'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <Eye className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">
                        Choose a form from the explorer to view its field
                        permissions.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  User Role Assignments
                </CardTitle>
                <CardDescription>
                  View and manage which roles are assigned to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.slice(0, 20).map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getCategoryColor(
                              user.role === 'owner' ? 'system' : 'custom'
                            )}
                          >
                            {user.role}
                          </Badge>
                          {user.role !== 'owner' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssignmentUser(user)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Change Role
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(roleDistribution).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between border rounded-lg p-3"
                        >
                          <span className="font-medium text-gray-700 capitalize">
                            {category}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Permission Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(permissions).map(([module, perms]) => (
                      <div
                        key={module}
                        className="flex justify-between items-center"
                      >
                        <span className="capitalize">{module}</span>
                        <span className="font-semibold">{perms.length}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showForm && (
        <RoleFormModal
          role={selectedRole}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedRole(null);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
          }}
        />
      )}

      {showPermissionMatrix && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Permission Matrix</h2>
              <Button
                variant="ghost"
                onClick={() => setShowPermissionMatrix(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <PermissionMatrix permissions={permissions} roles={roles} />
            </div>
          </div>
        </div>
      )}

      {assignmentUser && (
        <UserRoleAssignment
          userId={assignmentUser._id}
          isOpen={Boolean(assignmentUser)}
          onClose={() => setAssignmentUser(null)}
        />
      )}
    </div>
  );
}
