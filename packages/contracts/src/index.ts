export type FeatureSet = {
  documentUpload: boolean;
  semanticSearch: boolean;
  aiAgents: boolean;
  alerts: boolean;
  humanApproval: boolean;
};

export type SolutionBranding = {
  title: string;
  primaryColor: string;
};

export type SolutionAiConfig = {
  provider: string;
  agent: string;
  storePromptContent: boolean;
};

export type SolutionDataPolicy = {
  classification: "synthetic-only";
  retentionDays: number;
};

export type SolutionManifest = {
  solution: {
    id: string;
    name: string;
    version: string;
  };
  branding: SolutionBranding;
  features: FeatureSet;
  services: string[];
  ai: SolutionAiConfig;
  data: SolutionDataPolicy;
};

export type SolutionInfo = {
  id: string;
  name: string;
  version: string;
  branding: SolutionBranding;
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
