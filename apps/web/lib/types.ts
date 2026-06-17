export type AgentPermission = 'fileRead' | 'fileWrite' | 'shell' | 'network' | 'gitPush' | 'dangerousCommands';

export interface AgentProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  model: string;
  fallbackModels: string[];
  runtime: string;
  systemPrompt: string;
  skills: string[];
  tools: string[];
  workspace: string;
  permissions: Record<AgentPermission, boolean | 'ask'>;
  limits: {
    maxTurns: number;
    maxTokensPerTurn: number;
    maxRuntimeSeconds: number;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  permission: AgentPermission;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface SessionRecord {
  id: string;
  agentId: string;
  mode: 'chat' | 'goal';
  status: 'running' | 'completed' | 'stopped' | 'failed';
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
