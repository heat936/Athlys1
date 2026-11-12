# CI Orchestrator — Implementation Plan

## Architecture
- Keep this repository limited to its declared responsibility.
- Consume and emit versioned, schema-validated contracts; reject unknown incompatible versions.
- Use immutable source references and least-privilege identities.
- Emit structured logs and machine-readable evidence; redact sensitive values at source.

## Delivery sequence
1. Inspect repository and toolchain; establish baseline and Spec Kit CLI version.
2. Define component interfaces, schemas, and threat model.
3. Implement the smallest vertical slice with deterministic fixtures.
4. Add unit, integration, failure-injection, and security checks.
5. Verify on an independent runner and compare evidence.
6. Review diff, document operational runbook, and request approval before any external side effect.

## Risks and mitigations
- Provider lock-in: keep runner and result contracts provider-neutral.
- False green from cache: bind cache to source and workflow/config digests; mark cache-only results explicitly.
- Secret leakage: secret scanning, redaction, restricted artifact access, and no secrets in public repos.
- Partial execution: explicit statuses and completeness checks; never aggregate missing checks as success.
- Retry side effects: bounded retries, idempotency keys, and no deployment/release side effects in test jobs.

## Rollback
Revert the component change or disable its dispatch integration; preserve prior evidence. No destructive cleanup is part of the rollout.
