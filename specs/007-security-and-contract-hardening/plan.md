# CI Security and Contract Hardening — Plan

## Design
Apply small, component-owned changes on the existing feature branches. Keep the default branches unchanged. Each component validates only its own contract; Athlys1 remains the integration orchestrator.

## Delivery sequence
1. Audit current PR heads, workflow runs, artifacts, specifications, source, and tests.
2. Record the cross-component specification and acceptance criteria.
3. Harden evidence integrity (Athlys1), network allowlists (Athlys2), artifact signature/SBOM binding (Athlys4), telemetry redaction (Athlys5), and retry classification (Athlys6).
4. Preserve the existing quality-report component (Athlys3) and include it in the next consolidated suite.
5. Run all updated PR gates; inspect test logs, workflow conclusions, and evidence artifacts.
6. Update the immutable component lock only after each component PR check succeeds.
7. Attempt consolidated six-component execution only when the authorized read-only cross-repository secret and readiness variable are configured.
8. Review diffs and record residual controls before any merge or release decision.

## Security decisions
- Ed25519 verification is performed locally with Node's built-in crypto module.
- The public-key fingerprint must match an explicit trusted fingerprint list. The caller remains responsible for managing that trust list securely.
- CycloneDX 1.5 and 1.6 are the supported SBOM versions for this initial slice.
- No new runtime dependency or network download is introduced.
- Retry classification is fail-closed: an exception is retryable only when the error is explicitly marked retryable or an explicit policy callback returns true.

## Risks
- Trust fingerprints supplied from an untrusted source would defeat signer trust; production integration must source them from protected configuration.
- CycloneDX subject binding does not by itself prove the SBOM is complete or generated from the same build; provenance and generator attestation remain future work.
- GitHub's 90-day artifact retention is not durable archival.
- A second CI provider and required branch checks are not yet configured.

## Rollback
Revert only the relevant component commit on the feature branch or restore the prior file contents from the PR history. Do not force-push or change main. No production side effects are part of this plan.
