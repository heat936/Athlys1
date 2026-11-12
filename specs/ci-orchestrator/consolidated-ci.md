# Consolidated six-repository CI architecture

Status: component PR gates are active in all six repositories; integrated cross-repository execution is implemented and safely gated pending a read-only credential.

## Objective
Provide a reliable PR gate for every code or documentation change, retain auditable test evidence, and run an integrated six-component suite from immutable source revisions without wasting runners on repeated tool installation.

## Execution model
- Every repository (Athlys1–Athlys6) runs its own lightweight Node.js 22 component test gate on every PR update. There are no path filters, so a PR cannot silently avoid its test gate because a changed file was omitted from a filter.
- Athlys1 owns the optional consolidated integration workflow. When enabled, one Ubuntu 24.04 runner checks out six allowlisted repositories at immutable SHAs from `specs/ci-orchestrator/component-lock.json` and executes all six test suites.
- Athlys2–Athlys6 retain a separate manual `workflow_dispatch` audit for the pinned official Spec Kit CLI. The CLI installation/scaffolding is deliberately outside routine PR checks.
- Each PR test workflow emits TAP output, adds it to the GitHub Actions job summary, and uploads a test-evidence artifact (14-day retention). The consolidated workflow uploads the source manifest and per-component TAP files (30-day retention).
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
- **Future:** signed attestations, SBOM generation, APK signing/verification, second independent CI provider, durable evidence store, automated cross-repository dispatch, and end-to-end product integration tests.
- A GitHub Actions artifact is temporary evidence, not a durable compliance archive.
