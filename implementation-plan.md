# Agentic OS — Detailed Implementation Plan

Project: Free/open-source local Agentic OS
Target: Multi-agent dashboard with Chat, Goal Mode, Workspace, Control Room, Skills, Memory, and a clean-room Claude Code-style coding agent
Primary LLM: OpenRouter free models
No local models
No leaked/proprietary code integration

---

## 1. Product Scope

Build a self-hosted Agentic OS that lets users run multiple AI agents from one UI.

### Core user experience

The user opens:

```txt
Agentic OS
```

They see:

```txt
LOCAL · BANGKOK

WORKSPACE
Mission Control

AGENTS
Claude
OpenClaw
Hermes
Gemini
Antigravity
Codex
Free Claude Code
```

Each agent supports:

- Chat
- Goal Mode
- Workspace
- Control Room
- Skills
- Memory
- Sessions
- File outputs
- Logs
- Stop/restart

---

## 2. Non-Negotiable Rules

### Legal/open-source rule

Do not copy or integrate leaked/proprietary Claude Code/CodingAgent Code source snapshots.

Use local coding-agent folders only for:

```txt
high-level architecture ideas
feature inspiration
workflow patterns
UI concepts
```

Implementation must be clean-room.

### Free/open-source rule

Prefer:

- free tiers
- open-source repos
- SQLite
- Vercel free frontend
- `.is-a.dev` free subdomain
- OpenRouter free models
- local machine for agent workers if no paid hosting is available

### No local models

Use OpenRouter only.

Preferred free models:

```txt
nex-agi/nex-n2-pro:free
deepseek-v4-free
nemotron-ultra-3-free
```

Model slugs should be configurable because OpenRouter model IDs can change.

---

## 3. Recommended Architecture

```txt
apps/web
  Next.js frontend
  Agent sidebar
  Chat UI
  Goal Mode UI
  Workspace UI
  Control Room UI
  Skill browser
  Memory panel

apps/api
  Agent manager
  Session manager
  OpenRouter provider
  Tool registry
  Skill loader
  Workspace manager
  File API
  Stream API
  SQLite storage

packages/core
  Shared types
  Agent profile schema
  Tool schema
  Event schema
  Message schema

agents/
  claude/
    profile.json
    system.md
    tools.json
  openclaw/
  hermes/
  gemini/
  antigravity/
  codex/
  free-claude-code/

skills/
  coding/
  ui-ux/
  research/
  deployment/
  memory/
  security/

workspaces/
  claude/
  openclaw/
  hermes/
  gemini/
  antigravity/
  codex/
  free-claude-code/

memory/
  USER.md
  MEMORY.md
  PROJECT.md

data/
  sessions.sqlite
  events.sqlite
  audit.jsonl

.env.example
docker-compose.yml
README.md
```

---

## 4. Technology Stack

### Frontend

```txt
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui optional
WebSocket or SSE for streaming
```

### Backend

Either:

```txt
FastAPI + Python
```

or:

```txt
Node.js + TypeScript
```

Recommended for fastest integration with Next.js:

```txt
Node.js + TypeScript
```

Recommended if deeply integrating Hermes/DeerFlow:

```txt
FastAPI/Python
```

### Agent runtime

Use:

```txt
Hermes Agent
DeerFlow
OpenHands
Aider
Custom clean-room Claude Code-style agent
```

### Storage

MVP:

```txt
SQLite
```

Later:

```txt
PostgreSQL/Neon
Redis queue
S3-compatible object storage
```

### Realtime

Use:

```txt
Server-Sent Events
```

or:

```txt
WebSocket
```

Recommended:

```txt
SSE for logs/streaming
WebSocket for Control Room live state
```

---

## 5. Agent Profiles

Each agent has a profile file.

Example:

```json
{
  "id": "claude",
  "name": "Claude",
  "description": "General reasoning and coding assistant.",
  "model": "nex-agi/nex-n2-pro:free",
  "fallbackModels": [
    "deepseek-v4-free",
    "nemotron-ultra-3-free"
  ],
  "runtime": "custom-coding-agent",
  "systemPrompt": "agents/claude/system.md",
  "skills": [
    "coding",
    "ui-ux",
    "research"
  ],
  "tools": [
    "read_file",
    "write_file",
    "edit_file",
    "search_files",
    "run_shell",
    "git_diff",
    "run_tests"
  ],
  "workspace": "claude",
  "permissions": {
    "fileWrite": true,
    "shell": true,
    "network": false,
    "gitPush": false,
    "dangerousCommands": "ask"
  },
  "limits": {
    "maxTurns": 50,
    "maxTokensPerTurn": 8192,
    "maxRuntimeSeconds": 3600
  }
}
```

### Agent list

```txt
Claude
OpenClaw
Hermes
Gemini
Antigravity
Codex
Free Claude Code
```

### Suggested model mapping

```json
{
  "claude": "nex-agi/nex-n2-pro:free",
  "openclaw": "deepseek-v4-free",
  "hermes": "nex-agi/nex-n2-pro:free",
  "gemini": "deepseek-v4-free",
  "antigravity": "nex-agi/nex-n2-pro:free",
  "codex": "nex-agi/nex-n2-pro:free",
  "free-claude-code": "nemotron-ultra-3-free"
}
```

---

## 6. Backend Modules

### 6.1 Agent Registry

Responsible for:

```txt
listAgents()
getAgent(agentId)
startAgent(agentId, mode, input)
stopAgent(sessionId)
resumeAgent(sessionId)
```

Data source:

```txt
agents/*.json
```

### 6.2 Session Manager

Responsible for:

```txt
createSession(agentId, mode)
saveMessage(sessionId, role, content)
saveToolCall(sessionId, toolName, args, result)
saveEvent(sessionId, event)
getTranscript(sessionId)
closeSession(sessionId)
```

Storage:

```txt
SQLite
```

### 6.3 OpenRouter Provider

Responsible for:

```txt
streamChat(messages, tools, model)
streamCompletion(prompt, model)
parseToolCalls(response)
trackTokenUsage(response)
retryWithFallbackModel()
```

Config:

```env
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_AGENT_MODEL=nex-agi/nex-n2-pro:free
FALLBACK_MODEL_1=deepseek-v4-free
FALLBACK_MODEL_2=nemotron-ultra-3-free
```

### 6.4 Tool Registry

Each tool has:

```txt
name
description
schema
permission
handler
dangerLevel
```

Example tools:

```txt
read_file
write_file
edit_file
search_files
list_files
run_shell
git_status
git_diff
apply_patch
run_tests
open_url
```

### 6.5 Skill Loader

Responsible for:

```txt
loadSkillMetadata()
activateSkill(skillName)
injectSkillIntoPrompt()
runSkillScript()
```

Skill format:

```txt
skills/
  skill-name/
    SKILL.md
    scripts/
    references/
```

Skill frontmatter:

```yaml
---
name: react-best-practices
description: Review React and Next.js code for performance and accessibility.
---
```

### 6.6 Workspace Manager

Responsible for:

```txt
createAgentWorkspace(agentId)
listFiles(workspaceId)
readFile(path)
writeFile(path, content)
editFile(path, patch)
deleteFile(path)
getGitDiff(workspaceId)
```

Safety:

```txt
Never allow path traversal.
Never allow agent to write outside assigned workspace.
Log every file operation.
```

### 6.7 Stream Manager

Responsible for:

```txt
send agent events to frontend in real time
```

Event types:

```txt
agent.started
agent.thinking
agent.message
agent.tool_call_started
agent.tool_call_finished
agent.file_changed
agent.git_diff
agent.error
agent.completed
agent.stopped
```

### 6.8 Approval Manager

Responsible for:

```txt
ask user before dangerous commands
ask user before git push
ask user before network access
ask user before destructive file actions
```

Approval policy:

```txt
read/search: allowed
write/edit: allowed inside workspace
run_shell: allowed for safe commands
dangerous shell: ask
git push: ask
network: disabled by default unless approved
```

### 6.9 Audit Logger

Responsible for:

```txt
log every agent action
log every tool call
log every approval
log every file change
```

Storage:

```txt
data/audit.jsonl
```

---

## 7. Frontend Pages

### 7.1 Mission Control

Shows:

```txt
active agents
active goals
system status
recent activity
quick actions
```

### 7.2 Agent Detail Page

Tabs:

```txt
Chat
Goal Mode
Workspace
Control Room
Skills
Memory
```

### 7.3 Chat Mode

Features:

```txt
message input
streaming response
tool call display
file change summary
copy response
retry
stop
```

### 7.4 Goal Mode

Features:

```txt
goal title
goal prompt
max turns
model selector
start goal
stop goal
progress log
final summary
output files
```

### 7.5 Workspace

Features:

```txt
file tree
file preview
diff view
open in editor
download outputs
```

### 7.6 Control Room

Features:

```txt
live logs
agent status
tool calls
token usage
memory usage if available
errors
warnings
kill button
restart button
```

### 7.7 Skills

Features:

```txt
skill list
skill descriptions
install/import skill
activate skill
skill source view
```

### 7.8 Memory

Features:

```txt
USER.md
MEMORY.md
PROJECT.md
edit memory
search memory
```

---

## 8. Clean-Room Claude Code-Style Agent

### 8.1 Purpose

Build a Claude Code-style coding agent without using leaked code.

### 8.2 Capabilities

```txt
inspect project
read files
search codebase
edit files
run commands
run tests
show git diff
ask for approval
save transcript
save final summary
```

### 8.3 Agent loop

```txt
1. Receive user task
2. Load agent profile
3. Load relevant skills
4. Inspect workspace
5. Create plan
6. Read relevant files
7. Decide tool call
8. Execute tool
9. Observe result
10. Continue loop
11. Ask approval for dangerous action
12. Stop when task is complete
13. Save summary and outputs
```

### 8.4 Tool contracts

#### read_file

```json
{
  "path": "src/index.ts"
}
```

#### write_file

```json
{
  "path": "src/index.ts",
  "content": "..."
}
```

#### edit_file

```json
{
  "path": "src/index.ts",
  "patch": "..."
}
```

#### search_files

```json
{
  "query": "useEffect",
  "glob": "**/*.{ts,tsx}"
}
```

#### run_shell

```json
{
  "command": "npm test",
  "cwd": "workspaces/codex"
}
```

#### git_diff

```json
{
  "path": "."
}
```

### 8.5 Safety

```txt
Block absolute paths outside workspace.
Block symlink escapes.
Block rm -rf without approval.
Block curl | bash without approval.
Block git push without approval.
Block sudo without approval.
Block destructive commands without approval.
```

---

## 9. Skill System

### 9.1 Skill sources

Use clean/open-source skill repos as reference:

```txt
anthropics/skills
vercel-labs/agent-skills
ComposioHQ/awesome-claude-skills
```

### 9.2 Initial bundled skills

```txt
coding-best-practices
react-nextjs-best-practices
ui-ux-review
api-design
testing
security-review
deployment
research
memory-management
```

### 9.3 Skill activation

User can activate:

```txt
/skill coding-best-practices
/skill react-nextjs-best-practices
/skill ui-ux-review
```

Or agent auto-selects based on task.

---

## 10. Memory System

### 10.1 Files

```txt
memory/USER.md
memory/MEMORY.md
memory/PROJECT.md
```

### 10.2 USER.md

Stores:

```txt
user preferences
coding style
workflow preferences
favorite tools
constraints
```

### 10.3 MEMORY.md

Stores:

```txt
long-term project facts
important decisions
recurring tasks
known issues
```

### 10.4 PROJECT.md

Stores:

```txt
current project summary
architecture
setup instructions
deployment notes
```

### 10.5 Memory update loop

After each goal:

```txt
1. summarize new facts
2. ask whether to remember
3. update MEMORY.md
4. update PROJECT.md if needed
```

---

## 11. Database Schema

SQLite tables:

```txt
agents
  id
  name
  description
  model
  profile_json
  created_at

sessions
  id
  agent_id
  mode
  status
  goal_title
  created_at
  updated_at
  ended_at

messages
  id
  session_id
  role
  content
  metadata_json
  created_at

tool_calls
  id
  session_id
  tool_name
  input_json
  output_json
  status
  started_at
  finished_at

events
  id
  session_id
  type
  payload_json
  created_at

files
  id
  session_id
  path
  action
  before_hash
  after_hash
  created_at

approvals
  id
  session_id
  action_type
  payload_json
  status
  created_at
```

---

## 12. API Routes

```txt
GET  /api/agents
GET  /api/agents/:id
POST /api/sessions
GET  /api/sessions/:id
POST /api/sessions/:id/messages
POST /api/sessions/:id/goals
POST /api/sessions/:id/stop
GET  /api/sessions/:id/events
GET  /api/workspaces/:agentId/files
GET  /api/workspaces/:agentId/files/*
POST /api/workspaces/:agentId/files/*
GET  /api/skills
POST /api/skills/import
GET  /api/memory
POST /api/memory
GET  /api/control-room
```

Streaming:

```txt
GET /api/sessions/:id/stream
```

---

## 13. Environment Variables

`.env.example`:

```env
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

DEFAULT_AGENT_MODEL=nex-agi/nex-n2-pro:free
FALLBACK_MODEL_1=deepseek-v4-free
FALLBACK_MODEL_2=nemotron-ultra-3-free

APP_URL=http://localhost:3000
API_URL=http://localhost:4000

WORKSPACE_ROOT=./workspaces
DATA_DIR=./data
MEMORY_DIR=./memory
SKILLS_DIR=./skills

ALLOWED_ORIGINS=http://localhost:3000
```

---

## 14. Security Plan

### 14.1 API key safety

```txt
OPENROUTER_API_KEY must only live in backend .env
Never expose it to frontend
Never commit .env
```

### 14.2 Workspace safety

```txt
Resolve paths with path.resolve()
Reject .. traversal
Reject absolute paths outside workspace
Reject symlink escapes
Log all file operations
```

### 14.3 Shell safety

```txt
Use cwd locked to workspace
Block dangerous commands by default
Require approval for destructive actions
Set timeout
Set max output size
Kill process on stop
```

### 14.4 Network safety

```txt
Disabled by default for agents
Allow only through approved tool
Optional proxy later
```

### 14.5 Audit

```txt
Every tool call logged
Every file change logged
Every approval logged
Every session saved
```

---

## 15. Development Phases

### Phase 1 — Project scaffold

Deliverables:

```txt
repo structure
package setup
.env.example
agent profiles
basic Next.js app
basic API server
SQLite setup
```

ETA:

```txt
1 day
```

### Phase 2 — OpenRouter integration

Deliverables:

```txt
OpenRouter provider
streaming chat
fallback models
token usage tracking
error handling
```

ETA:

```txt
1–2 days
```

### Phase 3 — Agent registry and sessions

Deliverables:

```txt
agent list
session creation
session storage
message history
stop/resume support
```

ETA:

```txt
2 days
```

### Phase 4 — Chat UI

Deliverables:

```txt
agent sidebar
chat page
streaming messages
tool call display
session selector
```

ETA:

```txt
2–3 days
```

### Phase 5 — Workspace manager

Deliverables:

```txt
per-agent workspaces
file tree
file read
file write
file edit
path safety
audit logging
```

ETA:

```txt
2–3 days
```

### Phase 6 — Tool registry

Deliverables:

```txt
read_file
write_file
edit_file
search_files
list_files
run_shell
git_status
git_diff
apply_patch
run_tests
```

ETA:

```txt
3–4 days
```

### Phase 7 — Clean-room Claude Code-style agent

Deliverables:

```txt
agent loop
tool calling
planning
file editing
test running
approval flow
git diff output
final summary
```

ETA:

```txt
7–14 days
```

### Phase 8 — Skills system

Deliverables:

```txt
skill loader
skill metadata
skill activation
bundled skills
skill browser UI
```

ETA:

```txt
3–4 days
```

### Phase 9 — Goal Mode

Deliverables:

```txt
goal creation
background agent run
max turns
stop button
progress log
final summary
output files
```

ETA:

```txt
3–5 days
```

### Phase 10 — Memory

Deliverables:

```txt
USER.md
MEMORY.md
PROJECT.md
memory editor
memory search
auto-summarization
```

ETA:

```txt
2–3 days
```

### Phase 11 — Control Room

Deliverables:

```txt
live logs
active sessions
tool calls
token usage
errors
warnings
kill button
restart button
```

ETA:

```txt
3–4 days
```

### Phase 12 — Multi-agent orchestration

Deliverables:

```txt
agent-to-agent delegation
shared mission board
parallel subtasks
agent status board
```

ETA:

```txt
5–7 days
```

### Phase 13 — Domain and deployment

Deliverables:

```txt
Vercel frontend
backend worker setup
.is-a.dev domain PR files
production env config
```

ETA:

```txt
2–3 days
```

### Phase 14 — Polish

Deliverables:

```txt
loading states
empty states
error states
responsive UI
dark theme
keyboard shortcuts
onboarding
```

ETA:

```txt
1 week
```

---

## 16. Build Order

Recommended order:

```txt
1. Scaffold
2. OpenRouter provider
3. Agent registry
4. Session manager
5. Chat UI
6. Workspace manager
7. Tool registry
8. Claude Code-style agent
9. Skills
10. Goal Mode
11. Memory
12. Control Room
13. Multi-agent
14. Deployment
15. Polish
```

---

## 17. Definition of Done

### MVP done when:

```txt
User can open UI
Select an agent
Send chat message
Agent responds through OpenRouter
Agent can read/write files in its workspace
Agent can run safe shell commands
Agent can show logs
Sessions are saved
```

### Public v1 done when:

```txt
Chat works
Goal Mode works
Workspace works
Skills work
Memory works
Control Room works
Claude Code-style agent works
OpenRouter free models configured
Vercel frontend deployed
.is-a.dev domain connected
```

---

## 18. Risks and Mitigations

### Risk: Vercel serverless timeouts

Mitigation:

```txt
Run long agent sessions on local worker or free-tier backend.
Use Vercel only for frontend.
```

### Risk: OpenRouter free model rate limits

Mitigation:

```txt
Add fallback models.
Add retry/backoff.
Allow user to switch model.
```

### Risk: Agent writes unsafe files

Mitigation:

```txt
workspace path locking
approval manager
audit log
```

### Risk: Agent runs dangerous shell commands

Mitigation:

```txt
dangerous command detection
approval required
timeout
max output size
kill switch
```

### Risk: Legal/IP issue

Mitigation:

```txt
Do not copy leaked/proprietary code.
Use clean-room implementation.
Use only open-source repos with clear licenses.
```

---

## 19. Immediate Next Tasks

```txt
1. Create repo scaffold
2. Add package.json files
3. Add .env.example
4. Add agent profile JSON files
5. Add OpenRouter provider
6. Add SQLite schema
7. Add first Chat API
8. Add Next.js sidebar
9. Add workspace manager
10. Add first clean-room coding agent loop
```
