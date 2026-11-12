# CI Orchestrator — Tasks

- [ ] Inspect current repository instructions, default branch, package/toolchain conventions, and existing workflows.
- [ ] Confirm Spec Kit CLI version and supported commands in the execution environment.
- [ ] Define JSON/schema contracts and compatibility policy.
- [ ] Define threat model, permissions, secrets handling, and network policy.
- [ ] Implement a minimal component vertical slice.
- [ ] Add unit and contract tests for acceptance criteria.
- [ ] Add failure-injection tests for relevant failure modes.
- [ ] Add structured logs and evidence manifest.
- [ ] Run formatting, lint, static analysis, tests, security checks, and build where applicable.
- [ ] Verify exact source SHA on an independent runner.
- [ ] Review final diff and document limitations, rollback, and approval gates.

## Dependencies
- Shared run/evidence contract owned by Athlys1 (orchestrator).
- Runner capability contract owned by Athlys2.
- Cross-component integration verification owned by Athlys6.
