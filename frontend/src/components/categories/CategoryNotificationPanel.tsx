import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, Star, Send, Users, Calendar, Filter } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryNotification {
  _id: string;
  category: {
    _id: string;
    name: string;
  };
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sender: {
    name: string;
    email: string;
  };
  recipients: Array<{
    user: {
      name: string;
      email: string;
    };
    readAt?: string;
    acknowledgedAt?: string;
  }>;
  isRead: boolean;
  isAcknowledged: boolean;
  sentAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface CategoryNotificationPanelProps {
  category: Category | null;
  isVisible: boolean;
  onClose: () => void;
}

const CategoryNotificationPanel: React.FC<CategoryNotificationPanelProps> = ({
  category,
  isVisible,
  onClose
}) => {
  const [notifications, setNotifications] = useState<CategoryNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<CategoryNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    recipientIds: [] as string[],
  });

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    if (isVisible && category) {
      loadNotifications();
    }
  }, [isVisible, category]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockNotifications: CategoryNotification[] = [
        {
          _id: '1',
          category: {
            _id: category?._id || 'mock-category-id',
            name: category?.name || 'Electronics',
          },
          title: 'Category Updated',
          message: 'The Electronics category has been updated with new attributes and pricing.',
          type: 'info',
          priority: 'medium',
          sender: {
            name: 'System Admin',
            email: 'admin@company.com',
          },
          recipients: [
            {
              user: {
                name: 'John Doe',
                email: 'john@company.com',
              },
              readAt: new Date().toISOString(),
            },
            {
              user: {
                name: 'Jane Smith',
                email: 'jane@company.com',
              },
            },
          ],
          isRead: true,
          isAcknowledged: false,
          sentAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          _id: '2',
          category: {
            _id: category?._id || 'mock-category-id',
            name: category?.name || 'Electronics',
          },
          title: 'Low Stock Alert',
          message: 'Several products in the Electronics category are running low on stock.',
          type: 'warning',
          priority: 'high',
          sender: {
            name: 'Inventory Manager',
            email: 'inventory@company.com',
          },
          recipients: [
            {
              user: {
                name: 'John Doe',
                email: 'john@company.com',
              },
            },
          ],
          isRead: false,
          isAcknowledged: false,
          sentAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
        {
          _id: '3',
          category: {
            _id: category?._id || 'mock-category-id',
            name: category?.name || 'Clothing',
          },
          title: 'New Category Created',
          message: 'A new subcategory "Winter Wear" has been added under Clothing.',
          type: 'success',
          priority: 'low',
          sender: {
            name: 'Category Manager',
            email: 'categories@company.com',
          },
          recipients: [
            {
              user: {
                name: 'John Doe',
                email: 'john@company.com',
              },
              readAt: new Date().toISOString(),
              acknowledgedAt: new Date().toISOString(),
            },
          ],
          isRead: true,
          isAcknowledged: true,
          sentAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ];
      
      setNotifications(mockNotifications);
      setFilteredNotifications(mockNotifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever filters change
  useEffect(() => {
    let result = [...notifications];
    
    if (filters.type !== 'all') {
      result = result.filter(n => n.type === filters.type);
    }
    
    if (filters.priority !== 'all') {
      result = result.filter(n => n.priority === filters.priority);
    }
    
    if (filters.status !== 'all') {
      if (filters.status === 'read') {
        result = result.filter(n => n.isRead);
      } else if (filters.status === 'unread') {
        result = result.filter(n => !n.isRead);
      } else if (filters.status === 'acknowledged') {
        result = result.filter(n => n.isAcknowledged);
      }
    }
    
    setFilteredNotifications(result);
  }, [filters, notifications]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      )
    );
    setFilteredNotifications(prev => 
      prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const handleAcknowledge = (id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n._id === id ? { ...n, isAcknowledged: true } : n
      )
    );
    setFilteredNotifications(prev => 
      prev.map(n => 
        n._id === id ? { ...n, isAcknowledged: true } : n
      )
    );
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleCreateNotification = () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      return;
    }
    
    // In a real app, this would make an API call
    const notification: CategoryNotification = {
      _id: `new-${Date.now()}`,
      category: {
        _id: category?._id || 'mock-category-id',
        name: category?.name || 'Unknown',
      },
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      priority: newNotification.priority,
      sender: {
        name: 'Current User',
        email: 'current@user.com',
      },
      recipients: [],
      isRead: false,
      isAcknowledged: false,
      sentAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [notification, ...prev]);
    setFilteredNotifications(prev => [notification, ...prev]);
    setNewNotification({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      recipientIds: [],
    });
    setShowCreateModal(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-500 bg-blue-100';
      case 'warning': return 'text-yellow-500 bg-yellow-100';
      case 'error': return 'text-red-500 bg-red-100';
      case 'success': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-500';
      case 'medium': return 'text-blue-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!isVisible || !category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Bell className="w-6 h-6 mr-2 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Notifications for: {category.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
              </div>
              
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </button>
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Notifications List */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="mt-2">No notifications for this category</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`border rounded-lg p-4 ${
                      notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className={`${getTypeColor(notification.type)} p-2 rounded-full mr-3`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900">{notification.title}</h3>
                            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(notification.priority)}`}>
                              <Star className="w-3 h-3 inline mr-1" />
                              {notification.priority}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                          
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <span>Sent by {notification.sender.name}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(notification.sentAt).toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center mt-3 space-x-3">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Mark as Read
                              </button>
                            )}
                            
                            {!notification.isAcknowledged && (
                              <button
                                onClick={() => handleAcknowledge(notification._id)}
                                className="text-sm text-green-600 hover:text-green-800 flex items-center"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Acknowledge
                              </button>
                            )}
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Users className="w-4 h-4 mr-1" />
                              {notification.recipients.length} recipients
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Unread
                          </span>
                        )}
                        {notification.isAcknowledged && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Notification</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter notification message"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({...newNotification, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="success">Success</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newNotification.priority}
                      onChange={(e) => setNewNotification({...newNotification, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotification}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Send Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryNotificationPanel;