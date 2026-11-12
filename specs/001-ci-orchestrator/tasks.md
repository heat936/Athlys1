# CI Orchestrator — Tasks

## Completed in the initial vertical slice
- [x] Inspect repository baseline, default branch, and existing instructions.
- [x] Install and verify the official Spec Kit CLI in CI; pin its upstream source commit.
- [x] Inspect current `specify init` syntax before use.
- [x] Smoke-test official Spec Kit scaffolding in an isolated temporary directory without overwriting repository files.
- [x] Define the component's initial versioned contract and acceptance behavior.
- [x] Implement the component's first executable vertical slice.
- [x] Add deterministic Node.js tests for core behavior and edge cases.
- [x] Execute fresh tests on Ubuntu 24.04 / Node 22: 7/7 passed.

## Remaining before component closure
- [ ] Complete security/threat-model review and document all trust boundaries.
- [ ] Add full static analysis, formatting/lint, dependency and security checks as appropriate.
- [ ] Add structured evidence export and durable retention; sign attestations where required.
- [ ] Validate exact-SHA execution on a second independent runner provider.
- [ ] Complete cross-repository contract and dispatch integration tests.
- [ ] Review final diff, document rollback, and open a draft pull request for human review.

## Constraints
- No production secrets in source control or logs.
- No automatic merge, deployment, release publication, DNS change, or database migration.
- A cached or skipped check is never reported as a fresh pass.


## Security and evidence hardening (2026-11-12)
- [x] Add SHA-256 evidence-manifest verification and detect post-generation tampering.
- [x] Add deterministic tests for valid and tampered manifests.
- [x] Confirm consolidated workflow run #87 passed on immutable source SHA `2a330424c38d0de23f1428233e2c0ea736dd2781`: both jobs succeeded; 53/53 distinct tests passed across all six components; all five private sibling checkouts succeeded.
- [x] Inspect run #87 job logs and artifact metadata; consolidated evidence artifact SHA-256 is `af8cdb1efbc8bf8727d0729316979846686adda1c651e4746dcebb5831439ba6`.
- [x] Correct README's stale 21/21 count and distinguish the Spec Kit CLI bootstrap evidence from the current consolidated CI workflow.
- [ ] Re-run CI on the latest PR head after the current branch upgraded checkout/setup-node/upload-artifact to immutable v7 action commits; run #87 used the prior v4 references and is not evidence for the later workflow revision.
- [ ] Verify the next run no longer emits the prior Node.js 20 deprecation warning.


## Verification snapshot (2026-11-12)
- Confirmed successful run: https://github.com/heat936/Athlys1/actions/runs/43228008056 (run #87).
- Run source SHA: `2a330424c38d0de23f1428233e2c0ea736dd2781`.
- Orchestrator job: 23/23 tests passed; consolidated suite: 53/53 distinct tests passed across six components, including the 4/4 cross-component suite.
- Both workflow jobs concluded `success`; the evidence artifacts were uploaded and are retained until 2027-02-10.
- The run log emitted Node.js 20 deprecation warnings from the older v4 action references. The branch now carries newer immutable v7 action pins, which must be verified by a fresh run before closing this task.
- No merge, release, production deployment, secrets, DNS, or database changes were performed.
