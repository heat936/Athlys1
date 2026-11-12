import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";

import { validateRunnerPolicy, runnerEvidence } from "../components/Athlys2/src/runner-policy.mjs";
import { buildQualityReport } from "../components/Athlys3/src/quality-report.mjs";
import { sha256, verifyArtifact } from "../components/Athlys4/src/artifact-verifier.mjs";
import { normalizeEvent, deduplicateAlerts } from "../components/Athlys5/src/observability.mjs";
import { validateComponentResults, retryIdempotently } from "../components/Athlys6/src/integration-contract.mjs";
import { aggregateResults, createEvidenceManifest, verifyEvidenceManifest } from "../src/orchestrator.mjs";
import { createRunRegistry, applyRunEvent, summarizeRun, createEventIdempotencyKey } from "../src/run-registry.mjs";

const repositories = [
  ["heat936/Athlys1", "ci-orchestrator"],
  ["heat936/Athlys2", "runner-infrastructure"],
  ["heat936/Athlys3", "quality-engine"],
  ["heat936/Athlys4", "artifact-security"],
  ["heat936/Athlys5", "observability"],
  ["heat936/Athlys6", "integration-harness"]
];
const commit = (index) => String(index + 1).repeat(40);

test("cross-component contracts compose from runner evidence to fail-closed orchestration", () => {
  const policy = {
    image: "ubuntu-24.04", ephemeral: true, timeoutSeconds: 600, vcpus: 2,
    allowedDomains: ["github.com"], env: { CI: "true" }
  };
  assert.deepEqual(validateRunnerPolicy(policy), []);
  const runner = runnerEvidence(policy, {
    runnerId: "integration-runner", startedAt: "2026-11-12T12:00:00Z",
    finishedAt: "2026-11-12T12:01:00Z"
  });
  assert.equal(runner.schemaVersion, "1.0");
  assert.equal("env" in runner, false);

  const quality = buildQualityReport(["unit", "contract"], [
    { name: "unit", status: "passed", fresh: true },
    { name: "contract", status: "passed", fresh: true }
  ]);
  assert.equal(quality.complete, true);
  assert.equal(quality.status, "success");

  const run = {
    runId: "cross-component-2026-11-12", repository: "heat936/Athlys3",
    commitSha: commit(2), ref: "refs/heads/spec/ci-independence-bootstrap",
    policyVersion: "1", requiredChecks: ["unit", "contract"]
  };
  const aggregate = aggregateResults(run, quality.checks);
  assert.equal(aggregate.complete, true);
  assert.equal(aggregate.status, "success");
  const manifest = createEvidenceManifest(run, quality.checks, runner);
  assert.equal(verifyEvidenceManifest(manifest).valid, true);

  const contracts = Object.fromEntries(
    ["orchestrator", "runner", "quality", "artifact", "observability"].map((name) => [
      name, { schemaVersion: "1.0", status: "passed", fresh: true }
    ])
  );
  assert.equal(validateComponentResults(contracts).valid, true);
});

test("artifact verifier accepts only bytes bound to trusted Ed25519 and CycloneDX evidence", () => {
  const bytes = Buffer.from("athlys-cross-component-fixture");
  const digest = sha256(bytes);
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const fingerprint = createHash("sha256")
    .update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
  const signature = sign(null, bytes, privateKey).toString("base64");
  const result = verifyArtifact({
    bytes,
    expectedDigest: digest,
    provenance: {
      commitSha: commit(3), runId: "cross-component-2026-11-12", version: "1.0.0",
      signature: { algorithm: "ed25519", publicKeyPem, signatureBase64: signature, subjectDigest: digest }
    },
    sbom: {
      bomFormat: "CycloneDX", specVersion: "1.6", version: 1,
      metadata: { component: { type: "application", name: "fixture", version: "1.0.0",
        hashes: [{ alg: "SHA-256", content: digest }] } },
      components: []
    },
    trustedKeyFingerprints: [fingerprint]
  });
  assert.equal(result.eligibleForRelease, true);
  assert.equal(result.publicationPerformed, false);
});

test("six-repository registry fails closed and reaches success only after six fresh passes", () => {
  const targets = repositories.map(([repository, component], index) => ({
    repository, component, commitSha: commit(index), requiredChecks: ["unit", "contract"]
  }));
  let registry = createRunRegistry({
    runId: "six-repo-integration", policyVersion: "1", targets
  });
  for (let index = 0; index < 5; index += 1) {
    const target = registry.targets.find((item) => item.repository === repositories[index][0]);
    const event = {
      eventId: `integration-${index}`, runId: registry.runId,
      repository: target.repository, component: target.component, commitSha: target.commitSha,
      attempt: 1, status: "passed",
      checks: target.requiredChecks.map((name) => ({ name, status: "passed", fresh: true })),
      idempotencyKey: createEventIdempotencyKey({
        runId: registry.runId, repository: target.repository,
        commitSha: target.commitSha, attempt: 1
      })
    };
    registry = applyRunEvent(registry, event).registry;
  }
  assert.equal(summarizeRun(registry).status, "incomplete");

  const target = registry.targets.find((item) => item.repository === repositories[5][0]);
  const event = {
    eventId: "integration-5", runId: registry.runId,
    repository: target.repository, component: target.component, commitSha: target.commitSha,
    attempt: 1, status: "passed",
    checks: target.requiredChecks.map((name) => ({ name, status: "passed", fresh: true })),
    idempotencyKey: createEventIdempotencyKey({
      runId: registry.runId, repository: target.repository,
      commitSha: target.commitSha, attempt: 1
    })
  };
  registry = applyRunEvent(registry, event).registry;
  assert.equal(summarizeRun(registry).status, "success");
  assert.equal(summarizeRun(registry).passed, 6);
});

test("observability redacts credentials and integration retries only transient failures", async () => {
  const event = normalizeEvent({
    eventId: "telemetry-1", occurredAt: "2026-11-12T12:00:00Z", status: "failed",
    details: { message: "access_token=top-secret" }
  });
  assert.doesNotMatch(event.details.message, /top-secret/);
  assert.equal(deduplicateAlerts([
    { key: "same", timestamp: 1000 }, { key: "same", timestamp: 2000 }
  ]).length, 1);

  let attempts = 0;
  const retry = await retryIdempotently(async ({ idempotencyKey }) => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error("temporary runner loss");
      error.retryable = true;
      throw error;
    }
    return idempotencyKey;
  }, { maxAttempts: 3, idempotencyKey: "stable-run-key" });
  assert.equal(retry.ok, true);
  assert.equal(retry.attempts, 2);
  assert.equal(retry.value, "stable-run-key");

  let invalidAttempts = 0;
  const noRetry = await retryIdempotently(async () => {
    invalidAttempts += 1;
    throw new Error("invalid contract");
  }, { maxAttempts: 3, idempotencyKey: "stable-invalid-key" });
  assert.equal(noRetry.ok, false);
  assert.equal(noRetry.attempts, 1);
  assert.equal(invalidAttempts, 1);
});
