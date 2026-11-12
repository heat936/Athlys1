# Cross-repository dispatch contract

Status: implemented as a deterministic plan-only contract; remote dispatch is intentionally disabled.

## Contract
- One run ID and policy version identify the orchestration request.
- Exactly six allowlisted repositories are accepted: Athlys1–Athlys6.
- Each repository must carry its expected component identity, immutable 40-character commit SHA, and unique non-empty required-check list.
- The manifest is sorted by repository and each target receives a deterministic SHA-256 idempotency key.
- Every target begins in `planned` state.

## Safety boundary
The current implementation returns `mode: plan_only` and `dispatchEnabled: false`. It does not call GitHub, start workflows, require a token, or perform external side effects. This prevents accidental fan-out while the dispatch credential and cross-repository permissions are not provisioned.

## Acceptance
- Reject unknown repositories, component mismatches, duplicate targets, incomplete target sets, mutable refs, and duplicate required checks.
- Same inputs in any target order produce the same ordered plan and idempotency keys.
- No credentials or network access are used by the planner.
