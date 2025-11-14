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
import { permissionsService, type Permission } from '@/services/permissions.service';
import { usersService } from '@/services/users.service';
import RoleFormModal from '@/components/roles/RoleFormModal';
import PermissionMatrix from '@/components/roles/PermissionMatrix';
import { Spinner } from '@/components/ui/spinner';
import { useHasPermission } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type ViewMode = 'grid' | 'list' | 'matrix';
type ActiveTab = 'overview' | 'roles' | 'permissions' | 'assignments' | 'analytics';

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

  const canManageRoles = user?.role === 'owner' || user?.role === 'admin' || useHasPermission('*') || useHasPermission('role:*');

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
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-for-assignments'],
    queryFn: () => usersService.getUsers({ limit: 100 }),
    enabled: canManageRoles,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: rolesService.delete,
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete role');
    },
  });

  const roles = rolesData?.roles || [];
  const permissions = permissionsData || {};
  const users = usersData?.users || [];

  // Filter roles
  const filteredRoles = useMemo(() => {
    let filtered = roles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(role => role.category === selectedCategory);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [roles, selectedCategory, searchTerm]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const totalRoles = roles.length;
    const activeRoles = roles.filter(r => r.isActive).length;
    const systemRoles = roles.filter(r => r.isSystemRole).length;
    const customRoles = totalRoles - systemRoles;

    const totalPermissions = Object.values(permissions).flat().length;
    const totalUsers = users.length;
    const assignedUsers = users.filter(u => u.role && u.role !== 'owner').length;

    return {
      totalRoles,
      activeRoles,
      systemRoles,
      customRoles,
      totalPermissions,
      totalUsers,
      assignedUsers,
      roleUtilization: totalUsers > 0 ? Math.round((assignedUsers / totalUsers) * 100) : 0,
    };
  }, [roles, permissions, users]);

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
    if (role.category === 'admin') return Shield;
    if (role.category === 'manager') return Settings;
    return Users;
  };

  const handleEdit = (role: Role) => {
    if (role.isSystemRole && !user?.role === 'owner') {
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
    if (window.confirm(`Are you sure you want to delete role "${role.name}"?`)) {
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
            <CardTitle className="text-xl text-red-900">Access Denied</CardTitle>
            <CardDescription className="text-red-700">
              You don't have permission to manage roles and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Contact your administrator to request access to role management features.
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
              <TabsList className="grid grid-cols-5 w-full h-12 bg-transparent border-0 p-1">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="roles"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Roles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden sm:inline">Permissions</span>
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Assignments</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-900">Total Roles</CardTitle>
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{analyticsData.totalRoles}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-blue-700">
                      {analyticsData.activeRoles} active
                    </div>
                    <div className="w-16 bg-blue-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${analyticsData.totalRoles > 0 ? (analyticsData.activeRoles / analyticsData.totalRoles) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-900">Permissions</CardTitle>
                    <Key className="w-5 h-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{analyticsData.totalPermissions}</div>
                  <p className="text-xs text-green-700 mt-2">
                    Across {Object.keys(permissions).length} modules
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-purple-900">User Coverage</CardTitle>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{analyticsData.roleUtilization}%</div>
                  <Progress value={analyticsData.roleUtilization} className="mt-2 h-2" />
                  <p className="text-xs text-purple-700 mt-2">
                    {analyticsData.assignedUsers} of {analyticsData.totalUsers} users assigned
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-orange-900">System Roles</CardTitle>
                    <Crown className="w-5 h-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">{analyticsData.systemRoles}</div>
                  <p className="text-xs text-orange-700 mt-2">
                    {analyticsData.customRoles} custom roles
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('roles')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Manage Roles</CardTitle>
                      <CardDescription>Create, edit, and organize roles</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowPermissionMatrix(true)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Key className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Permission Matrix</CardTitle>
                      <CardDescription>View and manage permissions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('assignments')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">User Assignments</CardTitle>
                      <CardDescription>Assign roles to users</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
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
              <PermissionMatrix permissions={permissions} roles={filteredRoles} />
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {rolesLoading ? (
                  <div className="col-span-full flex justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedCategory !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Create your first role to get started'
                      }
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
                      <Card key={role.id} className={`hover:shadow-lg transition-all duration-200 ${!role.isActive ? 'opacity-60' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${role.isSystemRole ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                <Icon className={`w-5 h-5 ${role.isSystemRole ? 'text-yellow-600' : 'text-blue-600'}`} />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{role.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    {role.code}
                                  </code>
                                  <Badge className={getCategoryColor(role.category)}>
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
                                <DropdownMenuItem onClick={() => handleEdit(role)}>
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
                                <span className="text-gray-600">{role.permissions?.length || 0} permissions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {role.isActive ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className={role.isActive ? 'text-green-600' : 'text-red-600'}>
                                  {role.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            {role.isSystemRole && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
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
                                <div key={perm.code} className="flex items-center gap-2 text-sm">
                                  <CheckSquare className="w-4 h-4 text-green-500" />
                                  <span className="text-gray-700">{perm.name}</span>
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
                      <span className="text-sm text-gray-600">Total Permissions</span>
                      <span className="font-semibold">{analyticsData.totalPermissions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Modules</span>
                      <span className="font-semibold">{Object.keys(permissions).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">System Permissions</span>
                      <span className="font-semibold">
                        {Object.values(permissions).flat().filter(p => p.isSystem).length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(user.role === 'owner' ? 'system' : 'custom')}>
                            {user.role}
                          </Badge>
                          {user.role !== 'owner' && (
                            <Button variant="outline" size="sm">
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
                    {roles.reduce((acc, role) => {
                      const category = role.category;
                      acc[category] = (acc[category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)}
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
                      <div key={module} className="flex justify-between items-center">
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
              <Button variant="ghost" onClick={() => setShowPermissionMatrix(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <PermissionMatrix permissions={permissions} roles={roles} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
