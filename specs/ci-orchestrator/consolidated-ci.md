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
The initial integrated attempt showed that the default Athlys1 `GITHUB_TOKEN` cannot read at least Athlys3 (GitHub returned “Repository not found”). The private repositories `Athlys3`–`Athlys6` must not be made public to work around this.

In Athlys1 repository settings:
1. Create a fine-grained token restricted to the four private repositories `Athlys3`, `Athlys4`, `Athlys5`, and `Athlys6`. `Athlys1` and `Athlys2` are public and do not require private-repository access.
2. Grant only repository **Contents: Read-only** (plus GitHub's mandatory Metadata read permission).
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


## Credential configuration re-check — 2026-11-12

The repository owner reports that `ATHLYS_READ_TOKEN` and `ATHLYS_CI_READY=true` have now been configured in Athlys1. The next PR synchronization is used to verify this operationally: the live consolidated job must actually start, authenticate to Athlys2–Athlys6, and complete the six test suites. Configuration is not considered verified until that run succeeds. No credential value is stored in this repository or this document.


## First live consolidated execution — 2026-11-12

Run: [Athlys — consolidated CI #87](https://github.com/heat936/Athlys1/actions/runs/43228008056)  
Commit: `2a330424c38d0de23f1428233e2c0ea736dd2781`

- Both jobs completed successfully: Athlys1 orchestrator tests and the live six-component test suite.
- All five private component checkouts (Athlys2–Athlys6) succeeded using the configured read-only credential. This operationally confirms that the secret and readiness variable were available to this run.
- Test results from the single consolidated runner: Athlys1 27/27, Athlys2 4/4, Athlys3 5/5, Athlys4 6/6, Athlys5 5/5, Athlys6 6/6 — **53 distinct tests passed, zero failures**.
- The separate cross-component suite was also executed and passed **4/4**. These four tests are already included in Athlys1's 27 tests, so they are not added again to the distinct-test total.
- All six repositories were checked out at the immutable SHAs listed in `component-manifest.txt`.
- CycloneDX 1.6 source inventory includes six components. SHA-256 checksums for all seven TAP files and the inventory were independently recomputed from the downloaded artifact and all matched.
- Evidence artifacts: `athlys-six-component-evidence-68077476b831e4a3dcd975a550ddb11cf7bfa9b9` and `athlys1-test-evidence-68077476b831e4a3dcd975a550ddb11cf7bfa9b9`, retained until 2027-02-10.

The initial consolidated run emitted a non-fatal warning because the then-pinned checkout/setup-node/upload-artifact actions targeted Node.js 20. This was resolved by the Node.js 24 action migration recorded below; the updated action workflows have now passed their component and consolidated test runs without that warning.

This verifies the six-component test/integration gate, not a production build, dependency-complete release SBOM, signed provenance, branch protection, merge, or deployment.


## Node.js 24 action runtime migration — 2026-11-12

The six-repository CI workflow set has been migrated from the prior Node.js 20 action releases to upstream action releases whose exact pinned commits declare `runs.using: node24`:

- `actions/checkout` v7.0.1 — `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- `actions/setup-node` v7.1.0 — `949feb2413d6458794dcd2491c4babbbce0c15c1`.
- `actions/upload-artifact` v7.0.2 — `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.
- `astral-sh/setup-uv` remains pinned to v5.4.2 — `d4b2f3b6ecc6e67c4457f6d3e41ec42d3d0fcb86`; it is a composite action and does not use the Node.js action runtime.

The three Node action pins were resolved from official upstream Git refs and their `action.yml` files were inspected at the pinned commits. All workflow triggers, read-only permissions, concurrency groups, test commands, artifact paths, and retention settings were preserved.

Specification and acceptance criteria: `specs/ci-orchestrator/node24-action-runtime-migration.md`.

Status: workflow changes applied to the six-repository feature branch and documented. The updated component and consolidated workflow runs are the remaining verification gate. No merge, release, or production deployment was performed.


### First post-migration consolidated verification

Run #91: https://github.com/heat936/Athlys1/actions/runs/43228810368  
Commit: `8400e4807c1a6da43351db375d67c597ec3913d7`

- Both jobs succeeded: Athlys1 orchestrator tests and the six-component suite.
- Athlys1: 23/23 orchestrator tests.
- Six component suites: Athlys1 27/27, Athlys2 4/4, Athlys3 5/5, Athlys4 6/6, Athlys5 5/5, Athlys6 6/6 — 53 distinct tests passed. The separate cross-component TAP file repeats four tests already discovered in Athlys1's suite and is not double-counted.
- All five private repository checkouts succeeded.
- CycloneDX 1.6 inventory contains six repositories. All eight SHA-256 entries in the evidence artifact were independently recomputed and matched.
- Artifact ZIP digest: `sha256:aac7cc05020df03d5a54ce4f77336ff314251961b242383047813e713594a405`.
- No Node.js 20 deprecation/forced-runtime warning was found in the six updated workflow job logs.
- After the component checks passed, `component-lock.json` was refreshed to the latest verified branch SHAs for Athlys2–Athlys6. A further consolidated run against the refreshed lock is the remaining verification of that lock-only change.

All six PRs remain open and draft. No merge, production deployment, or release publication occurred.
