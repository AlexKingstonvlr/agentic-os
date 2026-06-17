'use client';

import { useState, useEffect } from 'react';
import { FileTreeSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
}

interface FileTreeProps {
  agentId: string;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

function FileTreeItem({ path, node, agentId, onFileSelect, selectedPath, depth = 0 }: {
  path: string;
  node: FileNode;
  agentId: string;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const isSelected = selectedPath === path;

  const fullPath = path;

  async function loadChildren() {
    if (loading) return;

    if (children !== null) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${agentId}/files?path=${encodeURIComponent(fullPath)}`);
      const data = await response.json();
      if (data.files) {
        setChildren(data.files);
        setExpanded(true);
      }
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  }

  if (node.type === 'file') {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded ${isSelected ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-300 hover:bg-white/5'} cursor-pointer`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onFileSelect(fullPath)}
      >
        <span className="text-[11px] text-zinc-500">📄</span>
        <span className="text-sm truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded ${isSelected ? 'bg-cyan-400/10 text-cyan-200' : 'text-zinc-300 hover:bg-white/5'} cursor-pointer`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={loadChildren}
      >
        <span className="text-[11px]">
          {expanded ? '▼' : '▶'}
        </span>
        <span className="text-[11px] text-zinc-500">📁</span>
        <span className="text-sm font-medium">{node.name}</span>
      </div>
      {expanded && children !== null && (
        <div>
          {children.map((child) => (
            <FileTreeItem
              key={child.name}
              path={`${fullPath}/${child.name}`}
              node={child}
              agentId={agentId}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      {expanded && loading && (
        <div className="px-2 py-1 text-xs text-zinc-500" style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}>
          Loading...
        </div>
      )}
    </div>
  );
}

export function FileTree({ agentId, onFileSelect, selectedPath }: FileTreeProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [agentId]);

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${agentId}/files`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setFiles(data.files || []);
      }
    } catch {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <FileTreeSkeleton />;
  }

  if (error) {
    return <div className="p-4 text-center text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-0.5">
      {files.map((file) => (
        <FileTreeItem
          key={file.name}
          path={file.name}
          node={file}
          agentId={agentId}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
      {files.length === 0 && (
        <EmptyState
          icon="📁"
          title="No files yet"
          description="Files you create in this agent's workspace will appear here."
        />
      )}
    </div>
  );
}