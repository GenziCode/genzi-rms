import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, User, Send, Trash2 } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface ApprovalRequest {
  _id: string;
 category: {
    _id: string;
    name: string;
  };
  requestedBy: {
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  changeDetails: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  approvers: Array<{
    user: {
      name: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    timestamp?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CategoryApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onApprovalSubmit: (categoryId: string, changes: Partial<Category>, reason: string) => void;
  onApprovalAction: (approvalId: string, action: 'approve' | 'reject', comment?: string) => void;
  onApprovalCancel: (approvalId: string) => void;
}

const CategoryApprovalModal: React.FC<CategoryApprovalModalProps> = ({
  isOpen,
  onClose,
  category,
  onApprovalSubmit,
  onApprovalAction,
 onApprovalCancel
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'pending' | 'history'>('request');
  const [approvalReason, setApprovalReason] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [approvalComment, setApprovalComment] = useState('');
  const [changes, setChanges] = useState<Partial<Category>>({});

 // Simulated data - in a real app, this would come from an API
  useEffect(() => {
    if (category) {
      // Load approvals for the category
      const mockApprovals: ApprovalRequest[] = [
        {
          _id: '1',
          category: { _id: category._id, name: category.name },
          requestedBy: { name: 'John Doe', email: 'john@example.com' },
          status: 'pending',
          reason: 'Need to update category color and icon',
          changeDetails: [
            { field: 'color', oldValue: '#3B82F6', newValue: '#EF4444' },
            { field: 'icon', oldValue: '📁', newValue: '🛒' }
          ],
          approvers: [
            { user: { name: 'Jane Smith' }, status: 'pending' },
            { user: { name: 'Bob Johnson' }, status: 'approved' }
          ],
          createdAt: '2023-05-15T10:30:00Z',
          updatedAt: '2023-05-15T10:30:00Z'
        },
        {
          _id: '2',
          category: { _id: category._id, name: category.name },
          requestedBy: { name: 'Alice Brown', email: 'alice@example.com' },
          status: 'approved',
          reason: 'Adding new subcategory',
          changeDetails: [
            { field: 'name', oldValue: 'Electronics', newValue: 'Electronics & Gadgets' }
          ],
          approvers: [
            { user: { name: 'Jane Smith' }, status: 'approved' },
            { user: { name: 'Bob Johnson' }, status: 'approved' }
          ],
          createdAt: '2023-05-10T09:15:00Z',
          updatedAt: '2023-05-10T11:20:00Z'
        }
      ];
      setApprovals(mockApprovals);
    }
  }, [category]);

  if (!isOpen || !category) return null;

  const handleSubmitApproval = () => {
    if (!approvalReason.trim()) return;
    
    onApprovalSubmit(category._id, changes, approvalReason);
    setApprovalReason('');
    setChanges({});
  };

  const handleApproveReject = (action: 'approve' | 'reject') => {
    if (!selectedApproval) return;
    
    onApprovalAction(selectedApproval._id, action, approvalComment);
    setSelectedApproval(null);
    setApprovalComment('');
  };

  const handleCancelApproval = () => {
    if (!selectedApproval) return;
    
    onApprovalCancel(selectedApproval._id);
    setSelectedApproval(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Category Approval Workflow
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-70"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'request'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('request')}
              >
                Request Approval
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-30'
                }`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Approvals
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-30'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Approval History
              </button>
            </nav>
          </div>

          {/* Request Approval Tab */}
          {activeTab === 'request' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Request Changes for: {category.name}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Approval Request
                  </label>
                  <textarea
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe why these changes need approval..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Changes to Request
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="name-change"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!changes.name}
                        onChange={(e) => setChanges(prev => ({
                          ...prev,
                          name: e.target.checked ? category.name : undefined
                        }))}
                      />
                      <label htmlFor="name-change" className="ml-2 text-sm text-gray-700">
                        Category Name
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="description-change"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!changes.description}
                        onChange={(e) => setChanges(prev => ({
                          ...prev,
                          description: e.target.checked ? category.description : undefined
                        }))}
                      />
                      <label htmlFor="description-change" className="ml-2 text-sm text-gray-700">
                        Description
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="color-change"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!changes.color}
                        onChange={(e) => setChanges(prev => ({
                          ...prev,
                          color: e.target.checked ? category.color : undefined
                        }))}
                      />
                      <label htmlFor="color-change" className="ml-2 text-sm text-gray-700">
                        Color
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="icon-change"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!changes.icon}
                        onChange={(e) => setChanges(prev => ({
                          ...prev,
                          icon: e.target.checked ? category.icon : undefined
                        }))}
                      />
                      <label htmlFor="icon-change" className="ml-2 text-sm text-gray-700">
                        Icon
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitApproval}
                    disabled={!approvalReason.trim() || Object.keys(changes).length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Approval Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approvals Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Approval Requests</h3>
              
              {approvals.filter(a => a.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="mt-2">No pending approval requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals
                    .filter(a => a.status === 'pending')
                    .map(approval => (
                      <div key={approval._id} className="border border-gray-20 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900">{approval.category.name}</h4>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(approval.status)}`}>
                                {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Requested by: {approval.requestedBy.name}</p>
                            <p className="text-sm text-gray-500">Reason: {approval.reason}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setActiveTab('request');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700">Change Details:</h5>
                          <div className="mt-1 space-y-1">
                            {approval.changeDetails.map((change, idx) => (
                              <div key={idx} className="text-sm text-gray-600 flex">
                                <span className="font-medium">{change.field}:</span>
                                <span className="ml-2 line-through text-gray-400">{String(change.oldValue)}</span>
                                <span className="mx-2">→</span>
                                <span>{String(change.newValue)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setApprovalComment('');
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setApprovalComment('');
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                          <button
                            onClick={handleCancelApproval}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Approval History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-90">Approval History</h3>
              
              {approvals.length === 0 ? (
                <div className="text-center py-8 text-gray-50">
                  <Clock className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="mt-2">No approval history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals.map(approval => (
                    <div key={approval._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{approval.category.name}</h4>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(approval.status)}`}>
                              {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Requested by: {approval.requestedBy.name}</p>
                          <p className="text-sm text-gray-500">Reason: {approval.reason}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(approval.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedApproval(approval)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </button>
                      </div>

                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700">Change Details:</h5>
                        <div className="mt-1 space-y-1">
                          {approval.changeDetails.map((change, idx) => (
                            <div key={idx} className="text-sm text-gray-60 flex">
                              <span className="font-medium">{change.field}:</span>
                              <span className="ml-2 line-through text-gray-400">{String(change.oldValue)}</span>
                              <span className="mx-2">→</span>
                              <span>{String(change.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700">Approvers:</h5>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {approval.approvers.map((approver, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded ${
                                approver.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : approver.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {approver.user.name} ({approver.status})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approval Action Modal */}
          {selectedApproval && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedApproval.status === 'pending' ? 'Take Action' : 'Approval Details'}
                  </h3>
                  <button
                    onClick={() => setSelectedApproval(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedApproval.category.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">Requested by: {selectedApproval.requestedBy.name}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700">Change Details:</h5>
                    <div className="mt-1 space-y-1">
                      {selectedApproval.changeDetails.map((change, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex">
                          <span className="font-medium">{change.field}:</span>
                          <span className="ml-2 line-through text-gray-400">{String(change.oldValue)}</span>
                          <span className="mx-2">→</span>
                          <span>{String(change.newValue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedApproval.status === 'pending' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Comment (Optional)
                        </label>
                        <textarea
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Add your comment here..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleApproveReject('reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveReject('approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                      </div>
                    </>
                  )}

                  {selectedApproval.status !== 'pending' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedApproval(null)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryApprovalModal;