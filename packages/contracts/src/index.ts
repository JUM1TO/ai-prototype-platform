export type FeatureSet = {
  documentUpload: boolean;
  semanticSearch: boolean;
  aiAgents: boolean;
  alerts: boolean;
  humanApproval: boolean;
};

export type SolutionInfo = {
  id: string;
  name: string;
  version: string;
  features: FeatureSet;
};

export type AgentRunRequest = {
  agent: string;
  input: Record<string, unknown>;
  context: { userId: string; sessionId: string };
};

export type AgentRunResult = {
  runId: string;
  output: string;
  provider: string;
  requiresApproval: boolean;
};
