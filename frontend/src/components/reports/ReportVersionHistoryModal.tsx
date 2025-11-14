import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, History, RotateCcw, GitCompare, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  reportTemplatesService,
  type ReportTemplateVersion,
} from '@/services/reportTemplates.service';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';

interface ReportVersionHistoryModalProps {
  templateId: string;
  templateName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportVersionHistoryModal({
  templateId,
  templateName,
  isOpen,
  onClose,
}: ReportVersionHistoryModalProps) {
  const queryClient = useQueryClient();
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([
    null,
    null,
  ]);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['report-template-versions', templateId],
    queryFn: () => reportTemplatesService.getVersions(templateId),
    enabled: isOpen && !!templateId,
  });

  const rollbackMutation = useMutation({
    mutationFn: (version: number) => reportTemplatesService.rollback(templateId, version),
    onSuccess: () => {
      toast.success('Template rolled back successfully');
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      queryClient.invalidateQueries({ queryKey: ['report-template-versions', templateId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to rollback template');
    },
  });

  const compareMutation = useMutation({
    mutationFn: ([v1, v2]: [number, number]) =>
      reportTemplatesService.compare(templateId, v1, v2),
    onSuccess: (data) => {
      // Show comparison results
      const differences = Object.entries(data.differences)
        .filter(([_, changed]) => changed)
        .map(([field]) => field);
      
      if (differences.length === 0) {
        toast.info('No differences found between these versions');
      } else {
        toast.info(`Differences found: ${differences.join(', ')}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to compare versions');
    },
  });

  const handleVersionSelect = (version: number, index: 0 | 1) => {
    const newSelection: [number | null, number | null] = [...selectedVersions];
    if (newSelection[index] === version) {
      newSelection[index] = null;
    } else {
      newSelection[index] = version;
    }
    setSelectedVersions(newSelection);
  };

  const handleCompare = () => {
    if (selectedVersions[0] && selectedVersions[1]) {
      const [v1, v2] = selectedVersions.sort((a, b) => (a || 0) - (b || 0));
      compareMutation.mutate([v1!, v2!]);
    } else {
      toast.warning('Please select two versions to compare');
    }
  };

  const handleRollback = (version: number) => {
    if (
      window.confirm(
        `Are you sure you want to rollback to version ${version}? This will create a new version with the old configuration.`
      )
    ) {
      rollbackMutation.mutate(version);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-600">{templateName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compare Actions */}
        {selectedVersions[0] && selectedVersions[1] && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <span className="text-sm text-blue-900">
              Selected: v{selectedVersions[0]} and v{selectedVersions[1]}
            </span>
            <button
              onClick={handleCompare}
              disabled={compareMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-600 mt-4">Loading version history...</p>
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No version history</h3>
              <p className="text-gray-600">This template has no previous versions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version._id}
                  className={`p-4 border rounded-lg transition-all ${
                    version.isCurrentVersion
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">v{version.version}</span>
                          {version.isCurrentVersion && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {version.changedBy?.firstName || version.changedBy?.email || 'Unknown'}
                        </div>
                      </div>
                      {version.changeDescription && (
                        <p className="text-sm text-gray-700 mb-2">{version.changeDescription}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        {format(new Date(version.changedAt), 'PPpp')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={selectedVersions[0] === version.version || selectedVersions[1] === version.version}
                          onChange={() => {
                            const index = selectedVersions[0] === null ? 0 : 1;
                            handleVersionSelect(version.version, index as 0 | 1);
                          }}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600">Compare</span>
                      </div>
                      {!version.isCurrentVersion && (
                        <button
                          onClick={() => handleRollback(version.version)}
                          disabled={rollbackMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                          title="Rollback to this version"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

