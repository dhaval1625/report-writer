'use client';

import { useState } from 'react';
import Button from './Button';
import Textarea from './Textarea';
import ConfirmModal from './ConfirmModal';

export interface ReportTemplate {
  id: string;
  name: string;
  templateText: string;
  bulletPrefix: string;
  isActive: boolean;
}

interface TemplateEditorProps {
  templates: ReportTemplate[];
  onChange: (templates: ReportTemplate[]) => void;
}

const PRESET_TEMPLATES: Omit<ReportTemplate, 'id' | 'isActive'>[] = [
  {
    name: 'Client Status Update',
    templateText:
      'Today’s Work Summary ({{date:DD MMM YYYY}})\n\n{{info:Ticket ID}}\n\n{{points:➤}}\n\nSigning off for the Day!',
    bulletPrefix: '➤',
  },
  {
    name: 'Company Timesheet / PM Update',
    templateText: '{{info:Ticket ID}}\n\n{{points:-}}',
    bulletPrefix: '-',
  },
  {
    name: 'Simple Bullet List',
    templateText: 'Updates:\n{{points:•}}',
    bulletPrefix: '•',
  },
];

export default function TemplateEditor({
  templates,
  onChange,
}: TemplateEditorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || '',
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const [deletingTemplate, setDeletingTemplate] =
    useState<ReportTemplate | null>(null);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  const updateCurrentTemplate = (updates: Partial<ReportTemplate>) => {
    if (!selectedTemplateId) return;
    onChange(
      templates.map((t) =>
        t.id === selectedTemplateId ? { ...t, ...updates } : t,
      ),
    );
  };

  const handleCreateTemplate = () => {
    if (!newName.trim()) return;
    const newTemplate: ReportTemplate = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      templateText: 'Updates for {{date:DD MMM YYYY}}:\n\n{{points}}',
      bulletPrefix: '➤',
      isActive: true,
    };
    onChange([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setNewName('');
    setIsCreating(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('You must keep at least one template.');
      return;
    }
    const remaining = templates.filter((t) => t.id !== id);
    onChange(remaining);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(remaining[0].id);
    }
  };

  const loadPreset = (preset: Omit<ReportTemplate, 'id' | 'isActive'>) => {
    const newTemplate: ReportTemplate = {
      ...preset,
      id: crypto.randomUUID(),
      isActive: true,
    };
    onChange([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-card-border bg-card-bg p-6 shadow-sm transition-all duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-card-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Report Templates</h2>
          <p className="text-xs text-muted">
            Configure the layout & placeholders for your reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCreating ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Template name..."
                className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
                autoFocus
              />
              <Button
                onClick={handleCreateTemplate}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
              >
                Save
              </Button>
              <Button
                onClick={() => setIsCreating(false)}
                className="rounded-lg bg-muted-bg px-3 py-1.5 text-xs font-semibold text-muted hover:opacity-95"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted-bg"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Template
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Template List */}
        <div className="flex flex-col gap-2 border-r border-card-border pr-0 md:pr-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Active Templates
          </span>
          <div className="flex flex-col gap-1.5 max-h-55 overflow-y-auto pr-1">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 ${
                  t.id === selectedTemplateId
                    ? 'bg-accent/10 text-accent font-medium border border-accent/20'
                    : 'hover:bg-muted-bg border border-transparent text-foreground/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.isActive}
                    onChange={(e) => {
                      e.stopPropagation();
                      onChange(
                        templates.map((x) =>
                          x.id === t.id
                            ? { ...x, isActive: e.target.checked }
                            : x,
                        ),
                      );
                    }}
                    className="h-4 w-4 rounded border-card-border text-accent focus:ring-accent accent-accent cursor-pointer"
                  />
                  <span className="truncate text-sm">{t.name}</span>
                </div>
                {templates.length > 1 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingTemplate(t);
                    }}
                    className="p-1 text-muted hover:text-red-500 rounded-md hover:bg-muted-bg/50"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-card-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TEMPLATES.map((p, idx) => (
                <Button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="rounded-full bg-muted-bg hover:bg-muted/20 px-2.5 py-1 text-2xs text-muted hover:text-foreground font-medium transition-colors animate-none"
                >
                  + {p.name.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Template Editor fields */}
        {currentTemplate ? (
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Template Name
                </label>
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) =>
                    updateCurrentTemplate({ name: e.target.value })
                  }
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Default Bullet Symbol
                </label>
                <input
                  type="text"
                  value={currentTemplate.bulletPrefix}
                  onChange={(e) =>
                    updateCurrentTemplate({ bulletPrefix: e.target.value })
                  }
                  placeholder="e.g. ➤, -, •"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>Template Format</span>
                <span className="text-2xs text-accent normal-case font-normal">
                  Auto-saves changes
                </span>
              </label>
              <Textarea
                value={currentTemplate.templateText}
                onChange={(e) => {
                  if (e.target.value) {
                    updateCurrentTemplate({ templateText: e.target.value });
                  }
                }}
                className="h-32 border border-card-border bg-background font-mono"
                placeholder="Today's Work Summary ({{date:DD MMM YYYY}})\n\n{{points}}\n\nSigning off!"
              />
              <form>
                <input
                  value={defaultName}
                  onChange={(e) => {
                    if (e.target.value.length) {
                      setDefaultName(e.target.value);
                    }
                  }}
                />
              </form>
            </div>

            {/* Quick cheat sheet */}
            <div className="rounded-lg bg-muted-bg p-3.5 border border-card-border/50 text-xs flex flex-col gap-1.5">
              <span className="font-semibold text-foreground/90">
                Available placeholders:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-muted">
                <li>
                  <code className="text-accent bg-accent/5 px-1 rounded">
                    {'{{points}}'}
                  </code>{' '}
                  — Injects points with default bullet prefix.
                </li>
                <li>
                  <code className="text-accent bg-accent/5 px-1 rounded">
                    {'{{points:➤}}'}
                  </code>{' '}
                  — Injects points with custom bullet prefix (
                  <code className="font-mono">➤</code>).
                </li>
                <li>
                  <code className="text-accent bg-accent/5 px-1 rounded">
                    {'{{date:DD MMM YYYY}}'}
                  </code>{' '}
                  — Renders current date (e.g.{' '}
                  <code className="font-mono">18 JUN 2026</code>).
                </li>
                <li>
                  <code className="text-accent bg-accent/5 px-1 rounded">
                    {'{{info:Label}}'}
                  </code>{' '}
                  — Dynamically prompts you to input &quot;Label&quot; (e.g.,
                  Ticket ID, PM Name).
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 flex items-center justify-center border border-dashed border-card-border rounded-xl p-8 text-muted text-sm">
            Select or create a template to begin editing.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingTemplate !== null}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={() => {
          if (deletingTemplate) {
            handleDeleteTemplate(deletingTemplate.id);
            setDeletingTemplate(null);
          }
        }}
        title="Delete Template"
        message={
          deletingTemplate && (
            <span>
              Are you sure you want to delete the template{' '}
              <span className="font-semibold text-foreground">
                &ldquo;{deletingTemplate.name}&rdquo;
              </span>
              ? This will permanently remove this template configuration and
              cannot be undone.
            </span>
          )
        }
        confirmText="Delete Template"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
