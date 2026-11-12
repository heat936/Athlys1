import test from "node:test";
import assert from "node:assert/strict";
import { createRunRegistry, applyRunEvent, summarizeRun, createEventIdempotencyKey } from "../src/run-registry.mjs";

const entries = [
  ["heat936/Athlys1", "ci-orchestrator"],
  ["heat936/Athlys2", "runner-infrastructure"],
  ["heat936/Athlys3", "quality-engine"],
  ["heat936/Athlys4", "artifact-security"],
  ["heat936/Athlys5", "observability"],
  ["heat936/Athlys6", "integration-harness"]
];
const targets = entries.map(([repository, component], i) => ({
  repository, component, commitSha: String(i + 1).repeat(40), requiredChecks: ["unit", "contract"]
}));
const makeRegistry = () => createRunRegistry({ runId: "arena-2026-11-12-01", policyVersion: "1", targets });
const eventFor = (registry, index, attempt, status, eventId = `evt-${index}-${attempt}`) => {
  const target = registry.targets[index];
  return {
    eventId, runId: registry.runId, repository: target.repository, component: target.component,
    commitSha: target.commitSha, attempt, status,
    idempotencyKey: createEventIdempotencyKey({ runId: registry.runId, repository: target.repository, commitSha: target.commitSha, attempt })
  };
};

test("initializes exactly six allowlisted targets in planned state", () => {
  const registry = makeRegistry();
  assert.equal(registry.targets.length, 6);
  assert.ok(registry.targets.every((x) => x.status === "planned" && x.attempt === 0));
  assert.equal(summarizeRun(registry).status, "incomplete");
});

test("rejects an incomplete or untrusted repository set", () => {
  assert.throws(() => createRunRegistry({ runId: "x", policyVersion: "1", targets: targets.slice(0, 5) }), /exactly six/);
  assert.throws(() => createRunRegistry({ runId: "x", policyVersion: "1", targets: targets.map((x, i) => i ? x : { ...x, repository: "elsewhere/repo" }) }), /mismatch/);
});

test("accepts a matching result and makes duplicate events idempotent", () => {
  const registry = makeRegistry();
  const event = eventFor(registry, 0, 1, "passed");
  const accepted = applyRunEvent(registry, event);
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.registry.targets[0].status, "passed");
  const duplicate = applyRunEvent(accepted.registry, event);
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, "duplicate_event");
});

test("rejects mismatched commit, run, component, and idempotency key", () => {
  const registry = makeRegistry();
  assert.throws(() => applyRunEvent(registry, { ...eventFor(registry, 0, 1, "passed"), commitSha: "f".repeat(40) }), /SHA mismatch/);
  assert.throws(() => applyRunEvent(registry, { ...eventFor(registry, 0, 1, "passed"), runId: "other" }), /runId mismatch/);
  assert.throws(() => applyRunEvent(registry, { ...eventFor(registry, 0, 1, "passed"), component: "wrong" }), /unknown target/);
  assert.throws(() => applyRunEvent(registry, { ...eventFor(registry, 0, 1, "passed"), idempotencyKey: "bad" }), /idempotency/);
});

test("retries only infrastructure failures and never exceeds three attempts", () => {
  let registry = makeRegistry();
  registry = applyRunEvent(registry, eventFor(registry, 0, 1, "timeout")).registry;
  registry = applyRunEvent(registry, eventFor(registry, 0, 2, "startup_failure")).registry;
  registry = applyRunEvent(registry, eventFor(registry, 0, 3, "passed")).registry;
  assert.equal(registry.targets[0].status, "passed");
  assert.throws(() => applyRunEvent(registry, eventFor(registry, 1, 4, "passed")), /retry budget/);
});

test("does not retry product/test failures", () => {
  let registry = makeRegistry();
  registry = applyRunEvent(registry, eventFor(registry, 0, 1, "failed")).registry;
  assert.throws(() => applyRunEvent(registry, eventFor(registry, 0, 2, "passed")), /already terminal|retry/);
});

test("aggregates only six passed targets as success", () => {
  let registry = makeRegistry();
  for (let i = 0; i < 5; i++) registry = applyRunEvent(registry, eventFor(registry, i, 1, "passed")).registry;
  assert.equal(summarizeRun(registry).status, "incomplete");
  registry = applyRunEvent(registry, eventFor(registry, 5, 1, "passed")).registry;
  assert.deepEqual(summarizeRun(registry), {
    runId: "arena-2026-11-12-01", status: "success", complete: true,
    passed: 6, total: 6, retryable: []
  });
});
