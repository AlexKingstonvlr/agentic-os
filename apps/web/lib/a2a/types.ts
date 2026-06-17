export type A2ACapability =
  | 'code-review'
  | 'research'
  | 'file-operations'
  | 'testing'
  | 'chat'
  | 'deployment'
  | 'monitoring'
  | 'general';

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  capabilities: A2ACapability[];
  authentication?: { type: string };
  skills: string[];
}

export interface A2ATask {
  id: string;
  requester: string;
  target: string;
  type: string;
  input: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  createdAt: string;
  completedAt?: string;
}
