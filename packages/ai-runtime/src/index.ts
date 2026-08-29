import type { AgentRunRequest, AgentRunResult } from "@platform/contracts";

export type GenerationRequest = {
  system: string;
  input: Record<string, unknown>;
};

export type GenerationResult = { text: string; model: string };

export interface ModelProvider {
  readonly name: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly hasExternalSideEffect: boolean;
  execute(input: TInput): Promise<TOutput>;
}

export class MockModelProvider implements ModelProvider {
  readonly name = "mock";

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      model: "mock-v1",
      text: `Respuesta simulada para: ${JSON.stringify(request.input)}`
    };
  }
}

export class AgentRuntime {
  constructor(private readonly provider: ModelProvider) {}

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    const result = await this.provider.generate({
      system: `You are the ${request.agent} agent. Do not perform external actions without approval.`,
      input: request.input
    });

    return {
      runId: crypto.randomUUID(),
      output: result.text,
      provider: this.provider.name,
      requiresApproval: false
    };
  }
}
