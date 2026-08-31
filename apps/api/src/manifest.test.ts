import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  loadSolutionManifest,
  ManifestValidationError,
  validateSolutionManifest
} from "./manifest.js";

const validManifest = {
  solution: {
    id: "document-review",
    name: "Document review",
    version: "1.0.0"
  },
  branding: {
    title: "Document Review Demo",
    primaryColor: "#2563eb"
  },
  features: {
    documentUpload: true,
    semanticSearch: false,
    aiAgents: true,
    alerts: false,
    humanApproval: true
  },
  services: ["portal", "api"],
  ai: {
    provider: "mock",
    agent: "document-reviewer",
    storePromptContent: false
  },
  data: {
    classification: "synthetic-only",
    retentionDays: 7
  }
};

test("validates a complete solution manifest", () => {
  const manifest = validateSolutionManifest(validManifest);
  assert.equal(manifest.solution.id, "document-review");
  assert.equal(manifest.branding.primaryColor, "#2563eb");
  assert.deepEqual(manifest.services, ["portal", "api"]);
});

test("rejects unsafe solution identifiers", async () => {
  await assert.rejects(
    () => loadSolutionManifest("../secrets"),
    (error: unknown) =>
      error instanceof ManifestValidationError && error.message.includes("kebab-case")
  );
});

test("rejects manifests that permit non-synthetic data", () => {
  assert.throws(
    () =>
      validateSolutionManifest({
        ...validManifest,
        data: { classification: "confidential", retentionDays: 7 }
      }),
    /data\.classification must be synthetic-only/
  );
});

test("loads YAML and verifies that its id matches the selected solution", async () => {
  const root = await mkdtemp(join(tmpdir(), "solution-manifest-"));
  const solutionDirectory = join(root, "other-solution");
  await mkdir(solutionDirectory);
  await writeFile(
    join(solutionDirectory, "solution.yaml"),
    `solution:
  id: document-review
  name: Document review
  version: 1.0.0
branding:
  title: Demo
  primaryColor: "#2563eb"
features:
  documentUpload: true
  semanticSearch: false
  aiAgents: true
  alerts: false
  humanApproval: true
services: [portal, api]
ai:
  provider: mock
  agent: document-reviewer
  storePromptContent: false
data:
  classification: synthetic-only
  retentionDays: 7
`,
    "utf8"
  );

  await assert.rejects(
    () => loadSolutionManifest("other-solution", root),
    /does not match SOLUTION_ID/
  );
});
