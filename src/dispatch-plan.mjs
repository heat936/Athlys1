import { createHash } from "node:crypto";

const SHA = /^[a-f0-9]{40}$/i;
const COMPONENTS = new Map([
  ["heat936/Athlys1", "ci-orchestrator"],
  ["heat936/Athlys2", "runner-infrastructure"],
  ["heat936/Athlys3", "quality-engine"],
  ["heat936/Athlys4", "artifact-security"],
  ["heat936/Athlys5", "observability"],
  ["heat936/Athlys6", "integration-harness"]
]);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Builds a deterministic, side-effect-free dispatch manifest.
 * This function deliberately does not call GitHub or trigger workflows.
 */
export function createDispatchPlan({ runId, policyVersion, targets }) {
  const errors = [];
  if (typeof runId !== "string" || !runId.trim()) errors.push("runId is required");
  if (typeof policyVersion !== "string" || !policyVersion.trim()) errors.push("policyVersion is required");
  if (!Array.isArray(targets) || targets.length !== COMPONENTS.size) {
    errors.push(`targets must contain exactly ${COMPONENTS.size} repositories`);
  }
  if (errors.length) throw new TypeError(errors.join("; "));

  const seen = new Set();
  const normalized = targets.map((target) => {
    if (!target || typeof target !== "object") throw new TypeError("each target must be an object");
    const { repository, component, commitSha, requiredChecks } = target;
    if (!COMPONENTS.has(repository)) throw new TypeError(`repository is not allowlisted: ${repository}`);
    if (COMPONENTS.get(repository) !== component) throw new TypeError(`component does not match repository: ${repository}`);
    if (seen.has(repository)) throw new TypeError(`duplicate repository: ${repository}`);
    seen.add(repository);
    if (!SHA.test(commitSha ?? "")) throw new TypeError(`commitSha must be a full SHA for ${repository}`);
    if (!Array.isArray(requiredChecks) || requiredChecks.length === 0 ||
        requiredChecks.some((name) => typeof name !== "string" || !name.trim())) {
      throw new TypeError(`requiredChecks must be a non-empty string array for ${repository}`);
    }
    if (new Set(requiredChecks).size !== requiredChecks.length) {
      throw new TypeError(`requiredChecks must be unique for ${repository}`);
    }
    const idempotencyKey = digest([runId, policyVersion, repository, commitSha].join("|"));
    return {
      repository,
      component,
      commitSha,
      requiredChecks: [...requiredChecks],
      idempotencyKey,
      state: "planned"
    };
  });

  if (seen.size !== COMPONENTS.size) throw new TypeError("all six allowlisted repositories are required");
  normalized.sort((a, b) => a.repository.localeCompare(b.repository));
  return {
    schemaVersion: "1.0",
    runId,
    policyVersion,
    mode: "plan_only",
    dispatchEnabled: false,
    targets: normalized
  };
}
