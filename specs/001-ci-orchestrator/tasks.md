# CI Orchestrator — Tasks

## Completed in the initial vertical slice
- [x] Inspect repository baseline, default branch, and existing instructions.
- [x] Install and verify the official Spec Kit CLI in CI; pin its upstream source commit.
- [x] Inspect current `specify init` syntax before use.
- [x] Smoke-test official Spec Kit scaffolding in an isolated temporary directory without overwriting repository files.
- [x] Define the component's initial versioned contract and acceptance behavior.
- [x] Implement the component's first executable vertical slice.
- [x] Add deterministic Node.js tests for core behavior and edge cases.
- [x] Execute fresh tests on Ubuntu 24.04 / Node 22: 5/5 passed.

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
