import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Bell,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  Monitor,
  Plus,
  Save,
  Trash2,
  Webhook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OffCanvas } from '@/components/ui/OffCanvas';
import {
  notificationTemplatesService,
  type NotificationTemplate,
} from '@/services/notificationTemplates.service';
import type { NotificationChannel } from '@/services/notifications.service';

const channelMeta: Record<
  NotificationChannel,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  email: { label: 'Email', icon: Mail },
  sms: { label: 'SMS', icon: MessageSquare },
  webhook: { label: 'Webhook', icon: Webhook },
  in_app: { label: 'In-App', icon: Monitor },
};

export default function NotificationTemplatesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{ search: string; channel: '' | NotificationChannel }>({
    search: '',
    channel: '',
  });
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    template: NotificationTemplate | null;
  }>({ open: false, template: null });
  const [previewData, setPreviewData] = useState<{
    open: boolean;
    subject?: string;
    content?: string;
    variables: string[];
  }>({ open: false, variables: [] });

  const listQuery = useQuery({
    queryKey: ['notification-templates', filters],
    queryFn: () =>
      notificationTemplatesService.list({
        search: filters.search || undefined,
        channel: filters.channel || undefined,
        limit: 50,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationTemplatesService.remove(id),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const templates = listQuery.data?.records ?? [];

  const handleDelete = (template: NotificationTemplate) => {
    if (
      window.confirm(
        `Delete template "${template.name}"? All versions will be removed. This cannot be undone.`
      )
    ) {
      deleteMutation.mutate(template._id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Communication System
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Notification Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage reusable templates across email, SMS, webhook, and in-app channels.
          </p>
        </div>
        <Button
          onClick={() => setDrawerState({ open: true, template: null })}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </header>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by name or key..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              className="pl-9"
            />
          </div>
          <select
            value={filters.channel}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                channel: event.target.value as NotificationChannel | '',
              }))
            }
            className="w-[200px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All channels</option>
            {Object.entries(channelMeta).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No templates yet</p>
            <p className="text-sm text-gray-500">Create your first notification template.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => (
              <article
                key={template._id}
                className="border border-gray-200 rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">Key · {template.key}</p>
                  </div>
                  <Badge variant="secondary">v{template.currentVersion}</Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {template.channels.map((channel) => {
                    const meta = channelMeta[channel];
                    const Icon = meta.icon;
                    return (
                      <Badge key={channel} variant="outline" className="flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </Badge>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setDrawerState({ open: true, template })}
                  >
                    Edit
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(template)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <TemplateFormDrawer
        open={drawerState.open}
        template={drawerState.template}
        onClose={() => setDrawerState({ open: false, template: null })}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
          setDrawerState({ open: false, template: null });
        }}
        onPreview={(preview) => setPreviewData({ open: true, ...preview })}
      />

      <OffCanvas
        isOpen={previewData.open}
        onClose={() => setPreviewData((prev) => ({ ...prev, open: false }))}
        title="Preview"
        size="lg"
      >
        {previewData.content ? (
          <div className="space-y-4">
            {previewData.subject && (
              <div>
                <p className="text-xs uppercase text-gray-500">Subject</p>
                <p className="font-medium text-gray-900 mt-1">{previewData.subject}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase text-gray-500">Content</p>
              <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap">
                {previewData.content}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Variables</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {previewData.variables.length === 0 ? (
                  <span className="text-sm text-gray-500">No variables detected</span>
                ) : (
                  previewData.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Generate a preview to see the rendered output.</div>
        )}
      </OffCanvas>
    </div>
  );
}

interface TemplateFormDrawerProps {
  open: boolean;
  template: NotificationTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
  onPreview: (payload: { subject?: string; content: string; variables: string[] }) => void;
}

function TemplateFormDrawer({
  open,
  template,
  onClose,
  onSuccess,
  onPreview,
}: TemplateFormDrawerProps) {
  const isEditing = Boolean(template);
  const [activeTab, setActiveTab] = useState('content');
  const buildFormState = (tmpl: NotificationTemplate | null) => ({
    name: tmpl?.name ?? '',
    key: tmpl?.key ?? '',
    description: tmpl?.description ?? '',
    category: tmpl?.category ?? '',
    tags: tmpl?.tags?.join(', ') ?? '',
    channels: tmpl?.channels ?? (['email'] as NotificationChannel[]),
    subject: tmpl?.defaultSubject ?? '',
    content:
      tmpl?.versions.find((v) => v.version === tmpl?.currentVersion)?.content ?? '',
    samplePayload: JSON.stringify(tmpl?.samplePayload ?? {}, null, 2),
    changeSummary: '',
  });
  const [formState, setFormState] = useState(() => buildFormState(template));

  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setFormState(buildFormState(template));
      setActiveTab('content');
    }
  }, [open, template]);

  const createMutation = useMutation({
    mutationFn: () => {
      let parsedPayload: Record<string, unknown> | undefined;
      if (formState.samplePayload.trim()) {
        parsedPayload = JSON.parse(formState.samplePayload);
      }
      if (isEditing) {
        return notificationTemplatesService.update(template!._id, {
          name: formState.name,
          description: formState.description,
          category: formState.category,
          tags: formState.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          channels: formState.channels,
          subject: formState.subject,
          content: formState.content,
          samplePayload: parsedPayload,
          changeSummary: formState.changeSummary || undefined,
        });
      }
      return notificationTemplatesService.create({
        name: formState.name,
        key: formState.key,
        description: formState.description,
        category: formState.category,
        tags: formState.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        channels: formState.channels,
        subject: formState.subject,
        content: formState.content,
        samplePayload: parsedPayload,
        changeSummary: formState.changeSummary || undefined,
      });
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Template updated' : 'Template created');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      onSuccess();
    },
    onError: (error) => {
      const message =
        (error as any)?.response?.data?.error?.message ?? 'Unable to save template';
      toast.error(message);
    },
  });

  const handlePreview = async () => {
    try {
      const payload =
        formState.samplePayload.trim().length > 0
          ? JSON.parse(formState.samplePayload)
          : {};
      const result = await notificationTemplatesService.preview({
        templateId: template?._id,
        subject: formState.subject,
        content: formState.content,
        data: payload,
      });
      onPreview(result);
    } catch (error) {
      toast.error('Invalid sample payload JSON');
    }
  };

  const disableSubmit =
    !formState.name.trim() ||
    (!isEditing && !formState.key.trim()) ||
    !formState.content.trim() ||
    createMutation.isPending;

  return (
    <OffCanvas
      isOpen={open}
      onClose={onClose}
      title={isEditing ? 'Edit Template' : 'New Template'}
      size="xl"
    >
      <form
        className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Key</label>
                <Input
                  value={formState.key}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, key: event.target.value }))
                  }
                  disabled={isEditing}
                  required={!isEditing}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Input
                    value={formState.category}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, category: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <Input
                    placeholder="Comma separated"
                    value={formState.tags}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, tags: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Channels</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(channelMeta).map((channel) => {
                    const meta = channelMeta[channel as NotificationChannel];
                    const Icon = meta.icon;
                    const isActive = formState.channels.includes(channel as NotificationChannel);
                    return (
                      <button
                        type="button"
                        key={channel}
                        onClick={() =>
                          setFormState((prev) => {
                            const channels = new Set(prev.channels);
                            if (channels.has(channel as NotificationChannel)) {
                              channels.delete(channel as NotificationChannel);
                            } else {
                              channels.add(channel as NotificationChannel);
                            }
                            return { ...prev, channels: Array.from(channels) };
                          })
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${
                          isActive
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Default Subject</label>
                <Input
                  value={formState.subject}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, subject: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sample Payload (JSON)</label>
              <textarea
                value={formState.samplePayload}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, samplePayload: event.target.value }))
                }
                rows={10}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Change Summary</label>
                <Input
                  placeholder="e.g., Added SMS copy"
                  value={formState.changeSummary}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, changeSummary: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="versions" disabled={!template}>
                Versions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-4 space-y-3">
              <textarea
                rows={12}
                value={formState.content}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, content: event.target.value }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </TabsContent>
            {template && (
              <TabsContent value="versions" className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {template.versions
                  .slice()
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <div
                      key={version.version}
                      className="border border-gray-200 rounded-lg p-3 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          Version {version.version}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{version.changeSummary}</p>
                      <div className="flex gap-2 flex-wrap">
                        {version.channels.map((channel) => (
                          <Badge key={channel} variant="outline">
                            {channelMeta[channel].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </TabsContent>
            )}
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button type="button" variant="ghost" onClick={handlePreview}>
              Preview
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={disableSubmit} className="gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {isEditing ? 'Save changes' : 'Create template'}
              </Button>
            </div>
          </div>
      </form>
    </OffCanvas>
  );
}

