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
- [x] Re-run CI after upgrading checkout/setup-node/upload-artifact to immutable v7 action commits: run #123 succeeded on SHA `2a977ccc25e3d524f15870f52710af12b37d7fc0`; both jobs succeeded, all six immutable component checkouts completed, and source inventory was generated.
- [x] Verify run #123 downloaded the three current v7 action SHAs and emitted no Node.js 20 deprecation warning.


## Verification snapshot (2026-11-12)
- Confirmed successful run: https://github.com/heat936/Athlys1/actions/runs/43228008056 (run #87).
- Run source SHA: `2a330424c38d0de23f1428233e2c0ea736dd2781`.
- Orchestrator job: 23/23 tests passed; consolidated suite: 53/53 distinct tests passed across six components, including the 4/4 cross-component suite.
- Both workflow jobs concluded `success`; the evidence artifacts were uploaded and are retained until 2027-02-10.
- The run log emitted Node.js 20 deprecation warnings from the older v4 action references. The branch now carries newer immutable v7 action pins, which must be verified by a fresh run before closing this task.
- No merge, release, production deployment, secrets, DNS, or database changes were performed.


## Latest-head verification after action upgrade (2026-11-12)
- [x] Run #123: https://github.com/heat936/Athlys1/actions/runs/43240381232
- [x] Immutable Athlys1 source SHA: `2a977ccc25e3d524f15870f52710af12b37d7fc0`.
- [x] Orchestrator job: 23/23 passed; six-component job: success; all five private sibling repositories checked out at the exact SHAs in `component-lock.json`.
- [x] Cross-component integration suite: 4/4 passed; CycloneDX source inventory generated for six repositories.
- [x] Verified current action pins from the actual run log: checkout `3d3c42e5aac5ba805825da76410c181273ba90b1`, setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1`, upload-artifact `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.
- [x] No Node.js 20 deprecation warning in run #123 logs.
- [x] Evidence artifacts uploaded: orchestrator SHA-256 `7b023ead0777d49c8f96f8b73712974679d5c39ecf4a035c7dd62099c9713e7e`; consolidated SHA-256 `41d5d2e06860044331c55f04aa4fca3f84a8b97bc1484fd760cc014d56e9d68f`.
- [ ] Independent CI provider and remaining threat-model/security closure remain outstanding.
