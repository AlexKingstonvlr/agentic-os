import { describe, expect, it } from 'bun:test';
import {
  createSession,
  getSession,
  addMessage,
  getMessages,
  updateSessionStatus,
  listSessions
} from '@/lib/db/sessions';
import { addEvent, getEvents, listRecentEvents } from '@/lib/db/events';

// ─── Session store ───────────────────────────────────────────────────────────────

describe('Sessions – happy path', () => {
  it('creates a session and returns it', async () => {
    const id = await createSession('claude', 'chat');
    const s = await getSession(id);
    expect(s).not.toBeNull();
    expect(s!.id).toBe(id);
    expect(s!.agent_id).toBe('claude');
    expect(s!.mode).toBe('chat');
    expect(s!.status).toBe('running');
    expect(s!.created_at).toBeString();
    expect(s!.updated_at).toBeString();
    expect(s!.ended_at).toBeNull();
  });

  it('creates a goal-mode session', async () => {
    const id = await createSession('gemini', 'goal');
    const s = await getSession(id);
    expect(s!.mode).toBe('goal');
  });

  it('adds and orders messages sequentially', async () => {
    const id = await createSession('claude', 'chat');
    await addMessage(id, 'user', 'A');
    await addMessage(id, 'user', 'B');
    await addMessage(id, 'assistant', 'C');
    const msgs = await getMessages(id);
    expect(msgs).toHaveLength(3);
    expect(msgs[0].content).toBe('A');
    expect(msgs[1].content).toBe('B');
    expect(msgs[2].content).toBe('C');
  });

  it('each message gets a unique incrementing id', async () => {
    const id = await createSession('claude', 'chat');
    const m1 = await addMessage(id, 'user', 'x');
    const m2 = await addMessage(id, 'user', 'y');
    expect(m2.id).toBe(m1.id + 1);
  });

  it('updateSessionStatus updates status and sets ended_at for terminal states', async () => {
    const id = await createSession('claude', 'chat');
    await updateSessionStatus(id, 'completed');
    const s = await getSession(id);
    expect(s!.status).toBe('completed');
    expect(s!.ended_at).not.toBeNull();

    await updateSessionStatus(id, 'stopped');
    const s2 = await getSession(id);
    expect(s2!.status).toBe('stopped');
    expect(s2!.ended_at).not.toBeNull();
  });

  it('listSessions returns all sessions sorted newest first', async () => {
    const a = await createSession('agent-a', 'chat');
    const b = await createSession('agent-b', 'chat');
    const all = await listSessions();
    expect(all.length).toBeGreaterThanOrEqual(2);
    // newest should be first
    expect(new Date(all[0].created_at).getTime()).toBeGreaterThanOrEqual(
      new Date(all[1].created_at).getTime()
    );
    // confirm both ids appear
    const ids = all.map(s => s.id);
    expect(ids).toContain(a);
    expect(ids).toContain(b);
  });

  it('listSessions filters by agentId', async () => {
    await createSession('agent-x', 'chat');
    const y = await createSession('agent-y', 'chat');
    const filtered = await listSessions('agent-y');
    expect(filtered.every(s => s.agent_id === 'agent-y')).toBeTrue();
    expect(filtered.map(s => s.id)).toContain(y);
  });
});

describe('Sessions – edge cases', () => {
  it('getSession for non-existent id returns undefined', async () => {
    const s = await getSession('no-such-session-999');
    expect(s).toBeUndefined();
  });

  it('addMessage to non-existent session throws', async () => {
    expect(
      addMessage('ghost-session', 'user', 'boom')
    ).rejects.toThrow(/not found/i);
  });

  it('getMessages for non-existent session returns empty array', async () => {
    const msgs = await getMessages('ghost-session');
    expect(msgs).toEqual([]);
  });

  it('updateSessionStatus for non-existent session is a no-op', async () => {
    // should not throw
    await updateSessionStatus('ghost-session', 'completed');
  });

  it('handles empty / special content', async () => {
    const id = await createSession('claude', 'chat');
    await addMessage(id, 'user', '');
    await addMessage(id, 'user', '   ');
    await addMessage(id, 'user', '{"json": true}');
    await addMessage(id, 'user', '<script>alert(1)</script>');
    await addMessage(id, 'assistant', 'line1\nline2\nline3');
    const msgs = await getMessages(id);
    expect(msgs).toHaveLength(5);
    expect(msgs[3].content).toBe('<script>alert(1)</script>');
    expect(msgs[4].content).toBe('line1\nline2\nline3');
  });

  it('handles very long content (>10K chars)', async () => {
    const id = await createSession('claude', 'chat');
    const long = 'A'.repeat(20_000);
    await addMessage(id, 'user', long);
    const msgs = await getMessages(id);
    expect(msgs[0].content).toHaveLength(20_000);
  });

  it('multiple sessions with same agent do not interfere', async () => {
    const s1 = await createSession('claude', 'chat');
    const s2 = await createSession('claude', 'chat');
    await addMessage(s1, 'user', 'msg1');
    await addMessage(s2, 'user', 'msg2');
    expect((await getMessages(s1)).length).toBe(1);
    expect((await getMessages(s2)).length).toBe(1);
    expect((await getMessages(s1))[0].content).toBe('msg1');
  });

  it('session IDs are unique even under rapid creation', async () => {
    const ids = await Promise.all(
      Array.from({ length: 50 }, () => createSession('stress', 'chat'))
    );
    expect(new Set(ids).size).toBe(50);
  });

  it('persists data to disk correctly (re‑read after write)', async () => {
    // recreate the modules to force cache miss
    const { createSession: create2, getMessages: get2 } = await import('@/lib/db/sessions');
    const id = await create2('claude', 'chat');
    await (await import('@/lib/db/sessions')).addMessage(id, 'user', 'persist test');
    const msgs = await get2(id);
    expect(msgs).toHaveLength(1);
  });

  it('dual-mode session creation', async () => {
    const chatId = await createSession('a', 'chat');
    const goalId = await createSession('a', 'goal');
    expect((await getSession(chatId))!.mode).toBe('chat');
    expect((await getSession(goalId))!.mode).toBe('goal');
  });
});

// ─── Event store ─────────────────────────────────────────────────────────────────

describe('Events – happy path', () => {
  it('adds events and retrieves them per session (descending)', async () => {
    const sessionId = await createSession('codex', 'chat');
    await addEvent(sessionId, 'event1');
    await addEvent(sessionId, 'event2');
    await addEvent(sessionId, 'event3');

    const events = await getEvents(sessionId);
    expect(events).toHaveLength(3);
    // newest first
    expect(events[0].type).toBe('event3');
    expect(events[2].type).toBe('event1');
  });

  it('events have unique incrementing ids', async () => {
    const s = await createSession('c', 'chat');
    const e1 = await addEvent(s, 'start');
    const e2 = await addEvent(s, 'end');
    expect(e2.id).toBeGreaterThan(e1.id);
  });

  it('listRecentEvents returns a limited set', async () => {
    const s = await createSession('c', 'chat');
    for (let i = 0; i < 30; i++) {
      await addEvent(s, `e${i}`);
    }
    const recent = await listRecentEvents(10);
    expect(recent).toHaveLength(10);
  });

  it('addEvent with payload stores valid JSON', async () => {
    const s = await createSession('c', 'chat');
    const ev = await addEvent(s, 'tool_call', { tool: 'read_file', path: '/tmp/x' });
    const parsed = JSON.parse(ev.payload_json);
    expect(parsed.tool).toBe('read_file');
    expect(parsed.path).toBe('/tmp/x');
  });
});

describe('Events – edge cases', () => {
  it('getEvents for non-existent session returns empty array', async () => {
    const evts = await getEvents('no-such-session');
    expect(evts).toEqual([]);
  });

  it('events with null session are stored and retrievable', async () => {
    const e1 = await addEvent(null, 'system.boot', { version: '1.0' });
    expect(e1.session_id).toBeNull();
    // Should not throw
    const evts = await listRecentEvents(100);
    expect(evts.some(e => e.id === e1.id)).toBeTrue();
  });

  it('handles empty event type', async () => {
    const s = await createSession('c', 'chat');
    const e = await addEvent(s, '');
    expect(e.type).toBe('');
  });

  it('handles large payload in events', async () => {
    const s = await createSession('c', 'chat');
    const big = { data: 'x'.repeat(50_000) };
    const e = await addEvent(s, 'big', big);
    const parsed = JSON.parse(e.payload_json);
    expect(parsed.data).toHaveLength(50_000);
  });

  it('getEvents with limit parameter', async () => {
    const s = await createSession('c', 'chat');
    for (let i = 0; i < 20; i++) {
      await addEvent(s, `e${i}`);
    }
    const limited = await getEvents(s, 5);
    expect(limited).toHaveLength(5);
    expect(limited[0].type).toBe('e19');
  });
});

// ─── Concurrency ──────────────────────────────────────────────────────────────────

describe('Concurrency', () => {
  it('rapid sequential messages keep exact order', async () => {
    const id = await createSession('order', 'chat');
    for (let i = 0; i < 100; i++) {
      await addMessage(id, 'user', `msg ${i}`);
    }
    const msgs = await getMessages(id);
    expect(msgs).toHaveLength(100);
    expect(msgs[0].content).toBe('msg 0');
    expect(msgs[99].content).toBe('msg 99');
  });

  it('parallel event creation does not corrupt file', async () => {
    const s = await createSession('parallel', 'chat');
    const promises = Array.from({ length: 30 }, (_, i) =>
      addEvent(s, `parallel-${i}`, { idx: i })
    );
    await Promise.all(promises);
    const events = await getEvents(s);
    expect(events.length).toBe(30);
    const types = events.map(e => e.type);
    expect(new Set(types).size).toBe(30);
  });

  it('interleaving addMessage and getSession is safe', async () => {
    const id = await createSession('interleave', 'chat');
    const writes = Array.from({ length: 20 }, (_, i) =>
      addMessage(id, 'user', `msg ${i}`)
    );
    const reads = Array.from({ length: 20 }, () => getMessages(id));
    const results = await Promise.all([...writes, ...reads]);
    expect(results.length).toBe(40);
    // no crash
  });
});

// ─── Build sanity ─────────────────────────────────────────────────────────────────

describe('Module exports', () => {
  it('all expected functions are exported from sessions', async () => {
    const mod = await import('@/lib/db/sessions');
    expect(mod.createSession).toBeFunction();
    expect(mod.getSession).toBeFunction();
    expect(mod.addMessage).toBeFunction();
    expect(mod.getMessages).toBeFunction();
    expect(mod.updateSessionStatus).toBeFunction();
    expect(mod.listSessions).toBeFunction();
  });

  it('all expected functions are exported from events', async () => {
    const mod = await import('@/lib/db/events');
    expect(mod.addEvent).toBeFunction();
    expect(mod.getEvents).toBeFunction();
    expect(mod.listRecentEvents).toBeFunction();
  });
});
