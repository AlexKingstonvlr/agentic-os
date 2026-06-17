'use client';

import { useState, useEffect, useCallback } from 'react';

interface FileEditorProps {
  agentId: string;
  filePath?: string;
}

export function FileEditor({ agentId, filePath }: FileEditorProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadContent = useCallback(async (signal: AbortSignal) => {
    if (!filePath) {
      setContent('');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${agentId}/files?path=${encodeURIComponent(filePath)}`, { signal });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setContent('');
      } else {
        setContent(data.content || '');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Failed to load file');
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [agentId, filePath]);

  useEffect(() => {
    const controller = new AbortController();
    loadContent(controller.signal);
    return () => controller.abort();
  }, [loadContent]);

  async function handleSave() {
    if (!filePath) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${agentId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError('Failed to save file');
    } finally {
      setSaving(false);
    }
  }

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        <p>Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/[0.02] rounded-2xl border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-sm font-medium text-zinc-300 truncate">{filePath}</p>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">Saved</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 text-zinc-500">Loading...</div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full bg-transparent border-none outline-none resize-none p-4 text-sm font-mono text-zinc-200 placeholder-zinc-600"
          placeholder="File content will appear here..."
          spellCheck={false}
        />
      )}

      <div className="px-4 py-3 border-t border-white/10 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-black disabled:opacity-50 hover:bg-cyan-200"
        >
          {saving ? 'Saving...' : 'Save (⌘S)'}
        </button>
      </div>
    </div>
  );
}