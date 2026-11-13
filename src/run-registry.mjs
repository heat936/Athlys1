import { createHash } from "node:crypto";

const SHA = /^[a-f0-9]{40}$/i;
const ALLOWLIST = new Map([
  ["heat936/Athlys1", "ci-orchestrator"],
  ["heat936/Athlys2", "runner-infrastructure"],
  ["heat936/Athlys3", "quality-engine"],
  ["heat936/Athlys4", "artifact-security"],
  ["heat936/Athlys5", "observability"],
  ["heat936/Athlys6", "integration-harness"]
]);
const TERMINAL = new Set(["passed", "failed", "startup_failure", "build_failure", "timeout", "cancelled", "runner_lost"]);
const RETRYABLE = new Set(["startup_failure", "timeout", "runner_lost"]);
const CHECK_STATES = new Set(["passed", "failed", "startup_failure", "build_failure", "timeout", "cancelled", "runner_lost", "cached", "skipped", "unavailable"]);
const MAX_ATTEMPTS = 3;

const hash = (value) => createHash("sha256").update(value).digest("hex");

export function createRunRegistry({ runId, policyVersion, targets }) {
  if (typeof runId !== "string" || !runId.trim()) throw new TypeError("runId is required");
  if (typeof policyVersion !== "string" || !policyVersion.trim()) throw new TypeError("policyVersion is required");
  if (!Array.isArray(targets) || targets.length !== ALLOWLIST.size) throw new TypeError("exactly six targets are required");

  const seen = new Set();
  const normalized = targets.map((target) => {
    if (!target || typeof target !== "object") throw new TypeError("target must be an object");
    const { repository, component, commitSha, requiredChecks } = target;
    if (ALLOWLIST.get(repository) !== component) throw new TypeError("repository/component mismatch or repository not allowlisted");
    if (seen.has(repository)) throw new TypeError("duplicate repository");
    seen.add(repository);
    if (!SHA.test(commitSha ?? "")) throw new TypeError("commitSha must be a full SHA");
    if (!Array.isArray(requiredChecks) || requiredChecks.length === 0 ||
        requiredChecks.some((x) => typeof x !== "string" || !x.trim()) ||
        new Set(requiredChecks).size !== requiredChecks.length) throw new TypeError("requiredChecks must be unique non-empty strings");
    return { repository, component, commitSha, requiredChecks: [...requiredChecks], attempt: 0, status: "planned", eventIds: [] };
  });
  if (seen.size !== ALLOWLIST.size) throw new TypeError("all six repositories are required");
  normalized.sort((a, b) => a.repository.localeCompare(b.repository));
  return { schemaVersion: "1.0", runId, policyVersion, targets: normalized, acceptedEvents: [] };
}

export function applyRunEvent(registry, event) {
  if (!registry || !Array.isArray(registry.targets)) throw new TypeError("valid registry is required");
  if (!event || typeof event !== "object") throw new TypeError("event must be an object");
  const { eventId, runId, repository, component, commitSha, attempt, status, idempotencyKey, checks } = event;
  if (typeof eventId !== "string" || !eventId.trim()) throw new TypeError("eventId is required");
  if (runId !== registry.runId) throw new TypeError("runId mismatch");
  const target = registry.targets.find((x) => x.repository === repository);
  if (!target || target.component !== component) throw new TypeError("unknown target or component mismatch");
  if (commitSha !== target.commitSha) throw new TypeError("commit SHA mismatch");
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > MAX_ATTEMPTS) throw new TypeError("attempt is outside the retry budget");
  if (!TERMINAL.has(status)) throw new TypeError("unsupported terminal status");
  if (!Array.isArray(checks) || checks.length !== target.requiredChecks.length) throw new TypeError("all required check results must be included");
  const checkNames = checks.map((check) => check?.name);
  if (checkNames.some((name) => typeof name !== "string") ||
      new Set(checkNames).size !== checkNames.length ||
      target.requiredChecks.some((name) => !checkNames.includes(name)) ||
      checkNames.some((name) => !target.requiredChecks.includes(name))) {
    throw new TypeError("check results must exactly match the required check names");
  }
  if (checks.some((check) => !CHECK_STATES.has(check.status) || typeof check.fresh !== "boolean")) {
    throw new TypeError("check result contains an unsupported status or freshness flag");
  }
  if (status === "passed" && checks.some((check) => check.status !== "passed" || check.fresh !== true)) {
    throw new TypeError("passed event requires every required check to be freshly passed");
  }
  const expectedKey = hash([runId, repository, commitSha, attempt].join("|"));
  if (idempotencyKey !== expectedKey) throw new TypeError("idempotency key mismatch");
  if (registry.acceptedEvents.includes(eventId)) return { registry, accepted: false, reason: "duplicate_event" };
  if (attempt < target.attempt) return { registry, accepted: false, reason: "stale_attempt" };
  if (attempt > target.attempt + 1) throw new TypeError("attempt sequence gap");
  if (["passed", "failed", "build_failure", "cancelled"].includes(target.status)) {
    return { registry, accepted: false, reason: "target_already_terminal" };
  }
  if (attempt === target.attempt && target.status !== "planned" && !RETRYABLE.has(target.status)) {
    return { registry, accepted: false, reason: "attempt_not_retryable" };
  }
  if (attempt > 1 && !RETRYABLE.has(target.status)) throw new TypeError("retry is allowed only after infrastructure failure");
  const next = structuredClone(registry);
  const nextTarget = next.targets.find((x) => x.repository === repository);
  nextTarget.attempt = attempt;
  nextTarget.status = status;
  nextTarget.eventIds.push(eventId);
  next.acceptedEvents.push(eventId);
  return { registry: next, accepted: true, reason: "accepted" };
}

export function summarizeRun(registry) {
  const statuses = registry.targets.map((x) => x.status);
  const complete = statuses.every((x) => x === "passed");
  const failed = statuses.some((x) => ["failed", "build_failure"].includes(x));
  const infraFailed = statuses.some((x) => ["startup_failure", "timeout", "runner_lost"].includes(x));
  const cancelled = statuses.some((x) => x === "cancelled");
  const running = statuses.some((x) => x === "running" || x === "dispatched");
  return {
    runId: registry.runId,
    status: complete ? "success" : failed ? "failed" : cancelled ? "cancelled" :
      infraFailed ? "infrastructure_failure" : running ? "running" : "incomplete",
    complete,
    passed: statuses.filter((x) => x === "passed").length,
    total: statuses.length,
    retryable: registry.targets.filter((x) => RETRYABLE.has(x.status) && x.attempt < MAX_ATTEMPTS).map((x) => x.repository)
  };
}

export function createEventIdempotencyKey({ runId, repository, commitSha, attempt }) {
  if (!SHA.test(commitSha ?? "")) throw new TypeError("commitSha must be a full SHA");
  return hash([runId, repository, commitSha, attempt].join("|"));
}
