# CI Security and Contract Hardening — Specification

Status: component hardening implemented; cross-component integration contract tests added to the consolidated workflow; consolidated execution remains gated by the read-only cross-repository credential.

## Objective
Close the highest-risk correctness gaps found in the initial six-repository audit while preserving the provider-neutral, least-privilege CI architecture.

## In scope
- Verify SHA-256 integrity of serialized orchestrator evidence manifests.
- Validate runner network allowlists as normalized fully qualified hostnames; reject wildcards, URLs, paths, ports, and duplicates.
- Verify Ed25519 artifact signatures against explicitly configured trusted-key fingerprints.
- Validate CycloneDX 1.5/1.6 SBOM metadata and bind its SHA-256 subject digest to the exact artifact bytes.
- Redact credential assignments embedded in observability strings as well as credential-valued object properties.
- Retry integration operations only when failures are explicitly classified as retryable; preserve a stable idempotency key.
- Add deterministic tests for each changed behavior.

## Out of scope
- Enabling cross-repository CI before the read-only credential and repository variable are configured.
- Selecting or provisioning a second CI provider.
- Establishing a durable evidence archive or signing authority/key custody service.
- Publishing, replacing, or deleting releases; production deployments; DNS or database changes.
- Claiming that the supplied signing public key is trusted without a separately configured trust fingerprint.

## Acceptance criteria
1. A modified evidence manifest fails integrity verification.
2. Runner policy rejects wildcard, malformed, duplicate, scheme/path/port network entries.
3. Artifact eligibility requires a valid Ed25519 signature from a key whose fingerprint is in the caller's trust set.
4. Artifact eligibility requires a CycloneDX 1.5/1.6 SBOM whose metadata component SHA-256 matches the exact artifact digest.
5. Credential-like assignments in text and URL query strings are redacted before telemetry output.
6. Non-retryable integration errors stop after one attempt; retryable failures are bounded to at most three attempts and reuse the same idempotency key.
7. Each component PR workflow passes on its updated immutable PR head.
8. The consolidated workflow runs cross-component contract tests that compose runner, quality, orchestrator, artifact, observability, retry, and six-repository registry behavior.
9. The central lock manifest pins the updated component SHAs after their individual PR checks pass.

## Security and human decision boundaries
- Trusted signing fingerprints are trust anchors supplied by the consuming environment; this component does not create or provision trust.
- Hash integrity is not a digital signature. Signed build attestations remain a separate open gate.
- GitHub Actions artifacts remain temporary evidence with 90-day retention, not a permanent compliance archive.
- No secrets are written to repository files or logs.
