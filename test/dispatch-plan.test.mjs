import test from "node:test";
import assert from "node:assert/strict";
import { createDispatchPlan } from "../src/dispatch-plan.mjs";

const targets = [
  ["heat936/Athlys1", "ci-orchestrator"],
  ["heat936/Athlys2", "runner-infrastructure"],
  ["heat936/Athlys3", "quality-engine"],
  ["heat936/Athlys4", "artifact-security"],
  ["heat936/Athlys5", "observability"],
  ["heat936/Athlys6", "integration-harness"]
].map(([repository, component], index) => ({
  repository, component, commitSha: String(index + 1).repeat(40), requiredChecks: ["unit", "contract"]
}));

test("creates a deterministic side-effect-free six-repository plan", () => {
  const plan = createDispatchPlan({ runId: "run-42", policyVersion: "1", targets });
  assert.equal(plan.targets.length, 6);
  assert.equal(plan.mode, "plan_only");
  assert.equal(plan.dispatchEnabled, false);
  assert.ok(plan.targets.every((target) => target.state === "planned"));
});

test("sorts targets and produces stable idempotency keys", () => {
  const a = createDispatchPlan({ runId: "run-42", policyVersion: "1", targets });
  const b = createDispatchPlan({ runId: "run-42", policyVersion: "1", targets: [...targets].reverse() });
  assert.deepEqual(a.targets, b.targets);
});

test("rejects repositories outside the explicit allowlist", () => {
  assert.throws(() => createDispatchPlan({
    runId: "run-42", policyVersion: "1",
    targets: targets.map((target, i) => i === 0 ? { ...target, repository: "someone/other" } : target)
  }), /not allowlisted/);
});

test("rejects mismatched component identities and duplicate repositories", () => {
  assert.throws(() => createDispatchPlan({
    runId: "run-42", policyVersion: "1",
    targets: targets.map((target, i) => i === 0 ? { ...target, component: "wrong" } : target)
  }), /component does not match/);
  assert.throws(() => createDispatchPlan({
    runId: "run-42", policyVersion: "1",
    targets: targets.map((target, i) => i === 0 ? { ...target, repository: targets[1].repository } : target)
  }), /component does not match|duplicate repository/);
});

test("rejects mutable source identities and duplicate required checks", () => {
  assert.throws(() => createDispatchPlan({
    runId: "run-42", policyVersion: "1",
    targets: targets.map((target, i) => i === 0 ? { ...target, commitSha: "main" } : target)
  }), /full SHA/);
  assert.throws(() => createDispatchPlan({
    runId: "run-42", policyVersion: "1",
    targets: targets.map((target, i) => i === 0 ? { ...target, requiredChecks: ["unit", "unit"] } : target)
  }), /must be unique/);
});
