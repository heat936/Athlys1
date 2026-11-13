# CI Security and Contract Hardening — Tasks

## Audit and specification
- [x] Inspect six repository identities, PR states, branch heads, latest PR workflows, job outcomes, and evidence artifacts.
- [x] Inspect component source, tests, specifications, and current acceptance gaps.
- [x] Create this cross-component Spec Kit specification and plan.

## Component implementation
- [x] Athlys1: add evidence-manifest integrity verification and tamper detection tests.
- [x] Athlys2: validate fully qualified network allowlist hostnames and reject ambiguous entries.
- [x] Athlys4: perform Ed25519 signature verification against trusted fingerprints.
- [x] Athlys4: validate CycloneDX SBOM subject digest against artifact bytes.
- [x] Athlys5: redact inline credential assignments and validate alert deduplication windows.
- [x] Athlys6: retry only explicitly retryable failures and preserve idempotency keys.
- [ ] Athlys3: confirm existing quality-report behavior in updated consolidated suite; extend only if audit evidence identifies a defect.
- [x] Run updated PR workflows and inspect every test result: all six component gates passed; 47/47 tests passed.
- [x] Update Athlys1 immutable component lock with verified latest component SHAs.
- [ ] Execute consolidated six-component suite after credential/readiness setup; blocked until ATHLYS_READ_TOKEN and ATHLYS_CI_READY are configured.
- [x] Correct sibling checkout import paths in the cross-component suite; validate the Athlys1 PR workflow after the correction.
- [x] Pin checkout, setup-node, upload-artifact, and setup-uv workflow actions to full upstream commit SHAs across the six-repository CI slice.
- [x] Record the CI action dependency inventory and explicitly bound the CycloneDX source-inventory scope.
- [x] Fix source-inventory manifest validation ordering; final Athlys1 suite passed 23/23 with strict pipeline failure propagation.

## Remaining security and release gates
- [ ] Add full dependency/static/security scanning where applicable.
- [x] Generate a CycloneDX 1.6 six-repository source-tree inventory from immutable checked-out revisions; explicitly label it as source inventory, not a dependency-complete or release-build SBOM.
- [x] Enforce explicit Bash `pipefail` in all six component PR test gates so TAP failures cannot be masked by `tee`.
- [ ] Generate and validate dependency-complete SBOMs from actual release build inputs.
- [ ] Provision protected signing trust and signed build attestations.
- [ ] Select and provision a second independent CI provider.
- [ ] Establish approved durable evidence storage and retention controls.
- [ ] Inspect/configure mandatory branch protection or rulesets.
- [ ] Complete cross-component integration/failure-injection tests.

## Constraints
- No main-branch merge, production deployment, release publication, DNS change, Supabase migration, or secret mutation.
- No claim of signed provenance until a real trusted signing/attestation workflow is configured.
- No secrets in source, test fixtures, summaries, or artifacts.

- [x] Add cross-component contract tests to the consolidated CI job (runner → quality → orchestrator → evidence; artifact verification; telemetry redaction; retry behavior; six-target run aggregation).
- [ ] Execute the consolidated cross-component suite on the six immutable repository revisions; blocked until the read-only cross-repository credential and readiness variable are configured.
- [ ] Validate signed build provenance and dependency-complete SBOM generation from actual build inputs.
