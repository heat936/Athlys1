# Run registry and result aggregation contract

Status: implemented as a pure deterministic reducer; persistence and authenticated transport remain unprovisioned.

## Identity
Each run is identified by a run ID and policy version. It contains exactly six allowlisted repositories, their expected component identities, immutable full commit SHAs, and unique required-check lists.

## Event acceptance
Every result event must include event ID, run ID, allowlisted repository, matching component, exact source SHA, attempt number, terminal status, and deterministic SHA-256 idempotency key. Mismatched or stale events are rejected. Duplicate event IDs are idempotent.

## Retry policy
Maximum three attempts per target. Retry only infrastructure failures: startup failure, runner timeout, or runner loss. Never automatically retry test/build failures, cancellations, or validation failures.

## Aggregation
The overall run is successful only when all six target states are passed. Partial success, missing results, or infrastructure failures never become green.

## Security boundary
This module is a pure reducer. It does not authenticate webhooks, store events durably, dispatch workflows, access GitHub APIs, or hold credentials. A future transport adapter must verify the sender using a GitHub App installation token or another least-privilege approved identity, validate the event signature, enforce repository allowlists, and persist event IDs transactionally before enabling dispatch.
