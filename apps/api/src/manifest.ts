import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  FeatureSet,
  SolutionAiConfig,
  SolutionBranding,
  SolutionDataPolicy,
  SolutionManifest
} from "@platform/contracts";
import { parse } from "yaml";

const solutionIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(`Invalid solution manifest: ${message}`);
    this.name = "ManifestValidationError";
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ManifestValidationError(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ManifestValidationError(`${path} must be a non-empty string`);
  }
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new ManifestValidationError(`${path} must be a boolean`);
  }
  return value;
}

function features(value: unknown): FeatureSet {
  const input = record(value, "features");
  return {
    documentUpload: boolean(input.documentUpload, "features.documentUpload"),
    semanticSearch: boolean(input.semanticSearch, "features.semanticSearch"),
    aiAgents: boolean(input.aiAgents, "features.aiAgents"),
    alerts: boolean(input.alerts, "features.alerts"),
    humanApproval: boolean(input.humanApproval, "features.humanApproval")
  };
}

function branding(value: unknown): SolutionBranding {
  const input = record(value, "branding");
  const primaryColor = string(input.primaryColor, "branding.primaryColor");
  if (!hexColorPattern.test(primaryColor)) {
    throw new ManifestValidationError("branding.primaryColor must be a six-digit hex color");
  }
  return { title: string(input.title, "branding.title"), primaryColor };
}

function ai(value: unknown): SolutionAiConfig {
  const input = record(value, "ai");
  return {
    provider: string(input.provider, "ai.provider"),
    agent: string(input.agent, "ai.agent"),
    storePromptContent: boolean(input.storePromptContent, "ai.storePromptContent")
  };
}

function dataPolicy(value: unknown): SolutionDataPolicy {
  const input = record(value, "data");
  if (input.classification !== "synthetic-only") {
    throw new ManifestValidationError("data.classification must be synthetic-only");
  }
  if (!Number.isInteger(input.retentionDays) || Number(input.retentionDays) < 1) {
    throw new ManifestValidationError("data.retentionDays must be a positive integer");
  }
  return {
    classification: "synthetic-only",
    retentionDays: Number(input.retentionDays)
  };
}

export function validateSolutionManifest(value: unknown): SolutionManifest {
  const input = record(value, "manifest");
  const solution = record(input.solution, "solution");
  const id = string(solution.id, "solution.id");
  if (!solutionIdPattern.test(id)) {
    throw new ManifestValidationError("solution.id must use lowercase kebab-case");
  }
  if (!Array.isArray(input.services) || input.services.length === 0) {
    throw new ManifestValidationError("services must be a non-empty array");
  }

  return {
    solution: {
      id,
      name: string(solution.name, "solution.name"),
      version: string(solution.version, "solution.version")
    },
    branding: branding(input.branding),
    features: features(input.features),
    services: input.services.map((service, index) => string(service, `services.${index}`)),
    ai: ai(input.ai),
    data: dataPolicy(input.data)
  };
}

export async function loadSolutionManifest(
  solutionId: string,
  solutionsRoot = resolve(process.cwd(), "solutions")
): Promise<SolutionManifest> {
  if (!solutionIdPattern.test(solutionId)) {
    throw new ManifestValidationError("SOLUTION_ID must use lowercase kebab-case");
  }

  const manifestPath = resolve(solutionsRoot, solutionId, "solution.yaml");
  let source: string;
  try {
    source = await readFile(manifestPath, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    throw new ManifestValidationError(`cannot read ${manifestPath}: ${reason}`);
  }

  let parsed: unknown;
  try {
    parsed = parse(source);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown YAML error";
    throw new ManifestValidationError(`YAML parsing failed: ${reason}`);
  }

  const manifest = validateSolutionManifest(parsed);
  if (manifest.solution.id !== solutionId) {
    throw new ManifestValidationError(
      `solution.id ${manifest.solution.id} does not match SOLUTION_ID ${solutionId}`
    );
  }
  return manifest;
}
