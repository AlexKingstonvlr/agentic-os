-- Agents table (static profiles, but keep for future extensions)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  workspace TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sessions (per‑agent conversation or goal)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  mode TEXT NOT NULL CHECK (mode IN ('chat','goal')),
  status TEXT NOT NULL DEFAULT 'running',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT
);

-- Messages within a session
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tool calls log
CREATE TABLE IF NOT EXISTS tool_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  name TEXT NOT NULL,
  input_json TEXT,
  output_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('started','finished','error')),
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT
);

-- Events (generic logs for control room)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id),
  type TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
