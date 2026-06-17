'use client';

import { useEffect, useState, useCallback } from 'react';
import EmptyState from '@/components/EmptyState';

interface MarketplaceSkill {
  name: string;
  description: string;
  source: string;
  author: string;
  version: string;
  publishedAt: string;
  downloads: number;
  installed?: boolean;
}

interface InstalledSkill {
  name: string;
  description: string;
  source: string;
}

type Tab = 'browse' | 'installed';

export default function MarketplacePage() {
  const [tab, setTab] = useState<Tab>('browse');
  const [published, setPublished] = useState<MarketplaceSkill[]>([]);
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [publishSource, setPublishSource] = useState('');
  const [publishAuthor, setPublishAuthor] = useState('');
  const [importJson, setImportJson] = useState('');

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchPublished = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace');
      if (res.ok) {
        const data = await res.json();
        setPublished(data);
      }
    } catch {
      showMessage('error', 'Failed to load marketplace');
    }
  }, []);

  const fetchInstalled = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace?installed=true');
      if (res.ok) {
        const data = await res.json();
        setInstalled(data);
      }
    } catch {
      showMessage('error', 'Failed to load installed skills');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPublished(), fetchInstalled()]).finally(() => setLoading(false));
  }, [fetchPublished, fetchInstalled]);

  const handleInstall = async (skill: MarketplaceSkill) => {
    try {
      const exportRes = await fetch(`/api/marketplace/export?source=${encodeURIComponent(skill.source)}`);
      if (!exportRes.ok) {
        showMessage('error', 'Failed to fetch skill content');
        return;
      }
      const exported = await exportRes.json();
      const res = await fetch('/api/marketplace/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: exported.source, name: exported.name, content: exported.content }),
      });
      if (res.ok) {
        showMessage('success', `Installed "${skill.name}"`);
        fetchPublished();
        fetchInstalled();
      } else {
        showMessage('error', 'Failed to install skill');
      }
    } catch {
      showMessage('error', 'Failed to install skill');
    }
  };

  const handleUninstall = async (source: string) => {
    try {
      const res = await fetch('/api/marketplace/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      if (res.ok) {
        showMessage('success', 'Uninstalled skill');
        fetchPublished();
        fetchInstalled();
      } else {
        showMessage('error', 'Failed to uninstall skill');
      }
    } catch {
      showMessage('error', 'Failed to uninstall skill');
    }
  };

  const handleExport = async (source: string) => {
    try {
      const res = await fetch(`/api/marketplace/export?source=${encodeURIComponent(source)}`);
      if (!res.ok) {
        showMessage('error', 'Failed to export skill');
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${source}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', 'Exported skill');
    } catch {
      showMessage('error', 'Failed to export skill');
    }
  };

  const handlePublish = async () => {
    if (!publishSource || !publishAuthor) {
      showMessage('error', 'Please select a skill and enter an author name');
      return;
    }
    try {
      const res = await fetch('/api/marketplace/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: publishSource, author: publishAuthor }),
      });
      if (res.ok) {
        showMessage('success', 'Published skill to marketplace');
        setPublishSource('');
        setPublishAuthor('');
        fetchPublished();
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Failed to publish skill');
      }
    } catch {
      showMessage('error', 'Failed to publish skill');
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      showMessage('error', 'Please paste skill JSON');
      return;
    }
    try {
      const skill = JSON.parse(importJson);
      if (!skill.source || !skill.content) {
        showMessage('error', 'Invalid skill JSON format');
        return;
      }
      const res = await fetch('/api/marketplace/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill }),
      });
      if (res.ok) {
        showMessage('success', 'Imported skill');
        setImportJson('');
        fetchInstalled();
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Failed to import skill');
      }
    } catch {
      showMessage('error', 'Invalid JSON');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Marketplace</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
              <div className="h-4 bg-white/10 rounded w-full mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-white mb-4">Marketplace</h1>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-2 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('browse')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'browse'
              ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
              : 'text-zinc-400 border border-white/10 hover:bg-white/5'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab('installed')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'installed'
              ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
              : 'text-zinc-400 border border-white/10 hover:bg-white/5'
          }`}
        >
          Installed
        </button>
      </div>

      {tab === 'browse' && (
        <>
          {published.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No published skills"
              description="No skills have been published to the marketplace yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {published.map(skill => (
                <div
                  key={skill.source}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col"
                >
                  <p className="font-medium text-white truncate">{skill.name}</p>
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2 flex-1">{skill.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                    {skill.author && <span>by {skill.author}</span>}
                    <span>v{skill.version}</span>
                    <span>{skill.downloads} downloads</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {skill.installed ? (
                      <span className="inline-flex items-center rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                        Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstall(skill)}
                        className="rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-medium text-black hover:bg-cyan-200 transition-colors"
                      >
                        Install
                      </button>
                    )}
                    {skill.installed && (
                      <button
                        onClick={() => handleExport(skill.source)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors"
                      >
                        Export
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Publish Skill</h2>
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <select
                value={publishSource}
                onChange={e => setPublishSource(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50"
              >
                <option value="" className="bg-black text-zinc-400">Select installed skill...</option>
                {installed.map(s => (
                  <option key={s.source} value={s.source} className="bg-black text-white">{s.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={publishAuthor}
                onChange={e => setPublishAuthor(e.target.value)}
                placeholder="Author name"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50"
              />
              <button
                onClick={handlePublish}
                className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-medium text-black hover:bg-cyan-200 transition-colors"
              >
                Publish
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Import Skill</h2>
            <div className="max-w-lg space-y-3">
              <textarea
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                placeholder='Paste skill JSON here...'
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 resize-none"
              />
              <button
                onClick={handleImport}
                className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-medium text-black hover:bg-cyan-200 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'installed' && (
        <>
          {installed.length === 0 ? (
            <EmptyState
              icon="⚙"
              title="No installed skills"
              description="Install skills from the Browse tab to get started."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {installed.map(skill => (
                <div
                  key={skill.source}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col"
                >
                  <p className="font-medium text-white truncate">{skill.name}</p>
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-2 flex-1">{skill.description}</p>
                  <p className="mt-2 text-xs text-zinc-600">source: {skill.source}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleUninstall(skill.source)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      Uninstall
                    </button>
                    <button
                      onClick={() => handleExport(skill.source)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors"
                    >
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
