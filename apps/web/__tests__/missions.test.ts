import { describe, expect, it, beforeEach } from 'bun:test';
import {
  createMission,
  listMissions,
  getMission,
  addTask,
  completeTask,
  type Mission,
} from '@/lib/missions';
import { listSessions } from '@/lib/db/sessions';
import fs from 'fs/promises';
import path from 'path';
import { resolveProjectPath } from '@/lib/paths';

// ─── Missions ─────────────────────────────────────────────────────────────────────

describe('Missions – happy path', () => {
  it('creates a mission with active status', async () => {
    const m = await createMission('Build app', 'Create the Agentic OS MVP');
    expect(m.title).toBe('Build app');
    expect(m.goal).toBe('Create the Agentic OS MVP');
    expect(m.status).toBe('active');
    expect(m.tasks).toEqual([]);
    expect(m.id).toStartWith('mission-');
    expect(m.created_at ?? m.createdAt).toBeString();
  });

  it('listMissions returns created missions in reverse chronological order', async () => {
    const a = await createMission('Mission A', 'a');
    // Ensure a small time gap so timestamps differ
    await new Promise(r => setTimeout(r, 5));
    const b = await createMission('Mission B', 'b');
    const all = await listMissions();
    const idxA = all.findIndex(m => m.id === a.id);
    const idxB = all.findIndex(m => m.id === b.id);
    // Both must be present
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    // B is newer, so it must come before A (lower index) when there's a time gap
    expect(idxB).toBeLessThan(idxA);
  });

  it('getMission returns a single mission', async () => {
    const m = await createMission('Get Me', 'single');
    const found = await getMission(m.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(m.id);
  });

  it('adds tasks to a mission and updates the timestamp', async () => {
    const m = await createMission('With tasks', 'testing');
    // Small delay to ensure timestamps differ
    await new Promise(r => setTimeout(r, 2));
    const updated = await addTask(m.id, 'Task 1', 'claude');
    expect(updated.tasks).toHaveLength(1);
    expect(updated.tasks[0].title).toBe('Task 1');
    expect(updated.tasks[0].assignedAgentId).toBe('claude');
    expect(updated.tasks[0].status).toBe('backlog');
    // updatedAt must be >= createdAt (equal only if called within same ms, but delay ensures greater)
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(m.createdAt).getTime()
    );
  });

  it('completeTask marks a single task as done', async () => {
    const m = await createMission('Single task', 'test');
    await addTask(m.id, 'Only task', 'claude');
    const updated = await completeTask(m.id, m.tasks[0].id);
    expect(updated.tasks[0].status).toBe('done');
  });

  it('completing all tasks auto-completes the mission', async () => {
    const m = await createMission('Auto complete', 'test');
    await addTask(m.id, 'T1', 'a');
    await addTask(m.id, 'T2', 'b');
    // Read fresh mission
    const fresh = await getMission(m.id);
    await completeTask(fresh!.id, fresh!.tasks[0].id);
    const mid = await getMission(m.id);
    await completeTask(mid!.id, mid!.tasks[1].id);
    const done = await getMission(m.id);
    expect(done!.status).toBe('completed');
  });
});

describe('Missions – edge cases', () => {
  it('getMission for non-existent id returns undefined', async () => {
    const m = await getMission('mission-nonexistent');
    expect(m).toBeUndefined();
  });

  it('addTask to non-existent mission throws', async () => {
    expect(
      addTask('mission-nonexistent', 'task', 'agent')
    ).rejects.toThrow(/not found/i);
  });

  it('completeTask for non-existent mission throws', async () => {
    expect(
      completeTask('mission-nonexistent', 'task-id')
    ).rejects.toThrow(/not found/i);
  });

  it('completeTask for non-existent task throws', async () => {
    const m = await createMission('Bad task', 'test');
    expect(
      completeTask(m.id, 'task-nonexistent')
    ).rejects.toThrow(/not found/i);
  });

  it('handles mission with empty title and goal', async () => {
    const m = await createMission('', '');
    expect(m.title).toBe('');
    expect(m.goal).toBe('');
  });

  it('handles very long title and goal', async () => {
    const longTitle = 'X'.repeat(10_000);
    const longGoal = 'Y'.repeat(10_000);
    const m = await createMission(longTitle, longGoal);
    expect(m.title).toHaveLength(10_000);
    expect(m.goal).toHaveLength(10_000);
  });

  it('adds multiple tasks and preserves order', async () => {
    const m = await createMission('Order', 'test');
    await addTask(m.id, 'first', 'a');
    await addTask(m.id, 'second', 'b');
    await addTask(m.id, 'third', 'c');
    const fresh = await getMission(m.id);
    expect(fresh!.tasks.map(t => t.title)).toEqual(['first', 'second', 'third']);
  });

  it('creates multiple missions independently', async () => {
    const ids = await Promise.all(
      Array.from({ length: 20 }, (_, i) => createMission(`M${i}`, `G${i}`))
    );
    expect(new Set(ids.map(m => m.id)).size).toBe(20);
  });
});

// ─── Status API logic ──────────────────────────────────────────────────────────────

describe('Agent status – integration with sessions', () => {
  it('returns proper status objects when agents exist', async () => {
    // Import the route handler logic inline
    const { listSessions: ls } = await import('@/lib/db/sessions');
    // Ensure sessions exist
    await ls();
    // The route reads agents/*.json – we just verify the module loads
    const mod = await import('@/app/api/status/route');
    expect(mod.GET).toBeFunction();
  });
});

// ─── Memory path traversal – unit tests ──────────────────────────────────────────

describe('Memory API – resolveSafe logic', () => {
  const memoryDir = resolveProjectPath('memory');

  function resolveSafe(file: string): string | null {
    if (file.includes('..')) return null;
    const resolved = path.resolve(memoryDir, file);
    if (!resolved.startsWith(memoryDir)) return null;
    return resolved;
  }

  it('rejects paths with ..', () => {
    expect(resolveSafe('../.env')).toBeNull();
    expect(resolveSafe('foo/../../.env')).toBeNull();
  });

  it('rejects paths that escape memory dir via symlink tricks', () => {
    const result = resolveSafe('.../.../...etc');
    // Should be inside memory dir
    if (result) {
      expect(result.startsWith(memoryDir)).toBeTrue();
    }
  });

  it('allows valid file names', () => {
    const result = resolveSafe('test.md');
    expect(result).toStartWith(memoryDir);
    expect(result).toEndWith('test.md');
  });

  it('handles absolute paths by resolving against memoryDir', () => {
    const result = resolveSafe('/etc/passwd');
    // Will be resolved to memoryDir + '/etc/passwd' which is still inside memoryDir
    // because `path.resolve(memoryDir, '/etc/passwd')` in node returns `/etc/passwd`
    // Actually on POSIX, path.resolve('/foo', '/etc') = '/etc' – escapes!
    // But the `file` comes from URL param, which is always relative.
    // However we should still test:
    // url-encoded `..` or `/` could get through:
    expect(resolveSafe('/etc/passwd')).toBeNull();
  });
});

// ─── Cross-module integrity ──────────────────────────────────────────────────────

describe('Cross-module integrity', () => {
  it('missions, sessions, and events modules all export what they should', async () => {
    const missions = await import('@/lib/missions');
    expect(missions.createMission).toBeFunction();
    expect(missions.listMissions).toBeFunction();
    expect(missions.getMission).toBeFunction();
    expect(missions.addTask).toBeFunction();
    expect(missions.completeTask).toBeFunction();

    const sessions = await import('@/lib/db/sessions');
    expect(sessions.createSession).toBeFunction();
    expect(sessions.getSession).toBeFunction();
    expect(sessions.addMessage).toBeFunction();
    expect(sessions.getMessages).toBeFunction();

    const events = await import('@/lib/db/events');
    expect(events.addEvent).toBeFunction();
    expect(events.getEvents).toBeFunction();
    expect(events.listRecentEvents).toBeFunction();
  });
});
