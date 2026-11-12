# Consolidated six-repository CI architecture

Status: component PR gates are active in all six repositories; integrated cross-repository execution is implemented and safely gated pending a read-only credential.

## Objective
Provide a reliable PR gate for every code or documentation change, retain auditable test evidence, and run an integrated six-component suite from immutable source revisions without wasting runners on repeated tool installation.

## Execution model
- Every repository (Athlys1–Athlys6) runs its own lightweight Node.js 22 component test gate on every PR update. There are no path filters, so a PR cannot silently avoid its test gate because a changed file was omitted from a filter.
- Athlys1 owns the optional consolidated integration workflow. When enabled, one Ubuntu 24.04 runner checks out six allowlisted repositories at immutable SHAs from `specs/ci-orchestrator/component-lock.json` and executes all six test suites.
- Athlys2–Athlys6 retain a separate manual `workflow_dispatch` audit for the pinned official Spec Kit CLI. The CLI installation/scaffolding is deliberately outside routine PR checks.
- Each PR test workflow emits TAP output, adds it to the GitHub Actions job summary, computes a SHA-256 checksum, and uploads both files as a test-evidence artifact (90-day retention). Each test step explicitly enables Bash `set -euo pipefail` so a failing Node test cannot be hidden by a successful `tee` process. The consolidated workflow uploads the source manifest, per-component TAP files, and a SHA-256 checksum manifest (90-day retention).
- All PR workflows use concurrency cancellation to stop superseded runs. Jobs have bounded timeouts and read-only repository permissions.
- The integrated job is skipped without allocating a runner unless repository variable `ATHLYS_CI_READY=true`. The Athlys1-only PR gate remains active.

## Immutable component lock
The file `specs/ci-orchestrator/component-lock.json` records the exact tested commit SHA for Athlys2–Athlys6. The consolidated workflow validates each SHA as 40 lowercase hexadecimal characters and checks out that exact commit, not a moving branch name.

After a component PR changes, update its lock entry only after its own PR workflow succeeds. The consolidated workflow then provides a reproducible integration check over that exact five-repository source set plus the Athlys1 PR head (or dispatch commit).

## Required one-time configuration for integrated runner
The initial integrated attempt showed that the default Athlys1 `GITHUB_TOKEN` cannot read at least Athlys3 (GitHub returned “Repository not found”). The repositories must not be made public to work around this.

In Athlys1 repository settings:
1. Create a fine-grained token restricted to exactly `Athlys1` through `Athlys6`.
2. Grant only repository **Contents: Read-only** (and mandatory Metadata read permission).
3. Save it as Actions secret `ATHLYS_READ_TOKEN`.
4. Add Actions repository variable `ATHLYS_CI_READY` with value `true` only after the secret is saved.

Never paste the token into chat, code, workflow files, or logs. A GitHub App installation token with equivalent read-only repository scope is also suitable, but requires an app installation and secret setup. No available connector can create or read a GitHub Actions secret value on the user's behalf.

## Trigger and freshness limitation
The consolidated workflow automatically runs when the Athlys1 PR is opened or updated. If only Athlys2–Athlys6 change, update the lock manifest after the component check succeeds, then start the consolidated workflow from Athlys1 → Actions → workflow_dispatch. Automated cross-repository event dispatch is not enabled because no write-capable GitHub App credential is provisioned.

## Security
- Read-only `contents: read` workflow permissions.
- Cross-repository token is used only by checkout and is not persisted.
- No PAT, GitHub App private key, production secret, deploy permission, or release permission is embedded in source.
- Only the six named repositories are checked out.
- Official Spec Kit CLI audit is pinned to upstream commit `979b0a3c1277283371c9901ad0eed04b64a99997`.
- Private Athlys3–Athlys6 repositories remain private.

## Acceptance and remaining gates
- **Passed:** each repository's own PR gate runs on every PR update and publishes test evidence.
- **Implemented, gated:** one-runner consolidated six-suite test after the read-only cross-repository credential is configured.
- **Not yet verified:** consolidated six-repository execution in one runner; current successful evidence comes from the six individual PR workflows.
- **Implemented, pending consolidated-run verification:** CycloneDX 1.6 source-tree inventory for all six immutable repository revisions. This is source inventory only, not dependency-complete SBOM.
- **Future:** dependency-complete SBOM from actual build inputs, signed attestations, APK signing/verification, second independent CI provider, durable evidence store, automated cross-repository dispatch, and end-to-end product integration tests.
- A GitHub Actions artifact is temporary evidence, not a durable compliance archive.


## Security-hardening verification update — 2026-11-12
- Athlys1 evidence manifest: SHA-256 verification and tamper detection added.
- Athlys2 runner policy: FQDN-only allowlist validation added; wildcard, URL, path, port, and duplicate entries rejected.
- Athlys4 artifact verification: Ed25519 signature is verified over the artifact bytes against a caller-supplied trusted fingerprint set; CycloneDX 1.5/1.6 SBOM subject digest is checked against the artifact SHA-256.
- Athlys5 observability: inline credential assignments and bearer values are redacted; alert window input is validated.
- Athlys6 integration harness: only explicitly retryable errors are retried; retry budget remains at three and the idempotency key is reused.
- Latest component PR checks passed: Athlys1 21/21, Athlys2 4/4, Athlys3 5/5, Athlys4 6/6, Athlys5 5/5, Athlys6 6/6 — 47/47 total. Test-evidence artifacts were present and unexpired at verification time.
- The immutable component lock has been refreshed to the verified component PR heads.
- A new source-inventory test initially exposed two defects: duplicate-manifest validation occurred after filesystem access, and test pipelines did not explicitly enable `pipefail`. Both were corrected. The final Athlys1 test job reported 23/23 passed; all five component workflow updates for Athlys2–Athlys6 completed successfully with strict pipeline handling.
- **Still blocked:** the integrated six-repository job remains intentionally skipped until the read-only secret ATHLYS_READ_TOKEN and repository variable ATHLYS_CI_READY=true are configured. No secret value is available to the connector.
- The security hardening is not a signed build-attestation system, does not generate production SBOMs from actual release builds, and does not establish durable evidence retention or a second CI provider.


## CI supply-chain hardening — 2026-11-12
- All external GitHub Actions referenced by the six-repository CI workflows are now pinned to full 40-character commit SHAs: checkout v4, setup-node v4, upload-artifact v4, and setup-uv v5.4.2.
- The pinned SHAs were resolved against the official upstream repositories; the setup-uv commit signature was verified through GitHub's commit verification metadata.
- The action dependency versions and the precise SBOM scope/limitations are recorded in `specs/ci-orchestrator/dependency-inventory.md`.
- Corrected cross-component test imports to resolve sibling checkouts from `components/Athlys1/integration` into `components/Athlys2` through `components/Athlys6`.
- The most recent Athlys1 PR workflow passed after the integration path correction and action pinning. The consolidated job was skipped as designed because `ATHLYS_CI_READY` is not configured; therefore cross-component tests have still not been executed by GitHub Actions.
- Branch-protection reads for all six repositories returned HTTP 403 from the connected GitHub integration. Branch protection is unknown, not verified absent; administrative access is required to inspect it.
