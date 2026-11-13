# CI Orchestrator — Specification

## Objective
Coordinate all CI components through one authoritative run contract. Resolve source repository/ref/SHA, dispatch bounded validation, aggregate evidence, classify failures, and enforce human approval gates.

## In scope
- A versioned component contract and documented interfaces.
- Security, observability, failure handling, and reproducibility appropriate to this component.
- Automated tests and operational documentation.

## Out of scope
- Cross-component ownership changes.
- Automatic production deployment, release publication, or destructive operations.
- Secrets or environment-specific credentials in source control.

## Acceptance criteria
1. A run cannot start without repository, immutable SHA, component contract, and policy version.
2. Infrastructure startup failure, test failure, build failure, timeout, cancellation, cache hit, and skipped check are distinct machine-readable states.
3. A cached result is never represented as a fresh execution; freshness is bound to source SHA, workflow/config digest, runner image, toolchain and test contract.
4. The orchestrator cannot merge, deploy, publish releases, change DNS, or mutate production secrets.
5. Every terminal run emits a signed or integrity-protected evidence manifest with links to job logs and artifact digests.

## Open questions to resolve during clarification
- Which external CI provider(s) will be the primary and secondary execution control planes?
- What retention period and storage location are approved for evidence bundles?
- Which artifact signing authority and key custody model are approved?
