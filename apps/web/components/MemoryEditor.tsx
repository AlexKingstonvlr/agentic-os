'use client';

import { useState } from 'react';

export function MemoryEditor({
  fileName,
  content,
  onSave
}: {
  fileName: string;
  content: string;
  onSave: (content: string) => void;
}) {
  const [editContent, setEditContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/memory/${encodeURIComponent(fileName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (!res.ok) return;
      onSave(editContent);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{fileName}</p>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-400">Saved</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || editContent === content}
            className="rounded-xl bg-cyan-300 px-4 py-1.5 text-xs font-medium text-black disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex gap-4 flex-1 min-h-0">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="flex-1 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300 outline-none focus:border-cyan-300/60 resize-none font-mono"
        />
        <div className="flex-1 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300 overflow-auto whitespace-pre-wrap">
          {editContent}
        </div>
      </div>
    </div>
  );
}
