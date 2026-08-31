import cors from "@fastify/cors";
import Fastify from "fastify";
import { AgentRuntime, MockModelProvider } from "@platform/ai-runtime";
import type { AgentRunRequest, SolutionInfo } from "@platform/contracts";
import { loadSolutionManifest } from "./manifest.js";

const app = Fastify({ logger: true });
const runtime = new AgentRuntime(new MockModelProvider());

await app.register(cors, { origin: true });

const solutionId = process.env.SOLUTION_ID ?? "document-review";
const manifest = await loadSolutionManifest(solutionId, process.env.SOLUTIONS_DIR);
const solution: SolutionInfo = {
  id: manifest.solution.id,
  name: manifest.solution.name,
  version: manifest.solution.version,
  branding: manifest.branding,
  features: manifest.features
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
