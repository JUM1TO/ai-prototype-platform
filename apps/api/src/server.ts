import cors from "@fastify/cors";
import Fastify from "fastify";
import { AgentRuntime, MockModelProvider } from "@platform/ai-runtime";
import type { AgentRunRequest, SolutionInfo } from "@platform/contracts";

const app = Fastify({ logger: true });
const runtime = new AgentRuntime(new MockModelProvider());

await app.register(cors, { origin: true });

const solution: SolutionInfo = {
  id: process.env.SOLUTION_ID ?? "document-review",
  name: "Revisión inteligente de documentos",
  version: "0.1.0",
  features: {
    documentUpload: true,
    semanticSearch: false,
    aiAgents: true,
    alerts: false,
    humanApproval: true
  }
};

app.get("/health", async () => ({ status: "ok" }));
app.get("/api/solution", async () => solution);

app.post<{ Body: AgentRunRequest }>("/api/agents/run", async (request, reply) => {
  if (!request.body?.agent || !request.body?.input || !request.body?.context) {
    return reply.code(400).send({ error: "Invalid agent request" });
  }
  return runtime.run(request.body);
});

const port = Number(process.env.PORT ?? 8080);
await app.listen({ host: "0.0.0.0", port });
