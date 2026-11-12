# Consolidated six-repository CI architecture

Status: workflow implemented; cross-repository execution is safely gated pending one read-only credential.

## Objective
Reduce six independent GitHub-hosted jobs to one consolidated runner for routine integrated verification while retaining an on-demand component/Spec Kit audit in each repository.

## Execution model
- Athlys1 owns the consolidated PR workflow.
- When enabled, one Ubuntu 24.04 runner checks out the six allowlisted repositories and executes `node --test` once per repository.
- Athlys2–Athlys6 expose manual-only component and official Spec Kit CLI audits. They do not start a runner for every ordinary PR push.
- The consolidated workflow cancels superseded runs for the same PR/ref and uses path filters to ignore irrelevant changes.
- Each checkout records its resolved commit SHA so the six-source set is auditable.
- Athlys1 runs one small local orchestrator test job on relevant PR updates. The cross-repository job is skipped without allocating a runner unless repository variable `ATHLYS_CI_READY=true`.

## Required one-time configuration
The initial integrated run showed that the default Athlys1 `GITHUB_TOKEN` cannot read at least Athlys3 (GitHub returned “Repository not found”). The repositories must not be made public just to work around this.

In Athlys1 repository settings:
1. Create a fine-grained token with access restricted to exactly `Athlys1` through `Athlys6`.
2. Grant only repository **Contents: Read-only** (and the mandatory Metadata read permission).
3. Save it as Actions secret `ATHLYS_READ_TOKEN`.
4. Add Actions repository variable `ATHLYS_CI_READY` with value `true` only after the secret is saved.

Do not paste the token into chat, code, workflow files, or logs. A GitHub App installation token with equivalent read-only repository scope is also suitable, but requires its own approved app setup.

## Trigger and freshness limitation
The consolidated workflow automatically runs when the Athlys1 PR is opened or updated. If only Athlys2–Athlys6 change, start the consolidated workflow from Athlys1 → Actions → workflow_dispatch. Automated cross-repository event dispatch is not enabled because no GitHub App credential is provisioned.

## Security
- Read-only `contents: read` workflow permission.
- Cross-repository token is used only by checkout and is not persisted.
- No PAT, GitHub App private key, production secret, deploy permission, or release permission is embedded in source.
- Only the six named repositories and their integration branch are checked out.
- Manual Spec Kit audit is pinned to upstream commit `979b0a3c1277283371c9901ad0eed04b64a99997`.

## Acceptance
- One consolidated runner executes all six test suites after access is configured.
- Any failed suite fails the single consolidated check.
- Superseded runs are cancelled.
- No cross-repository runner is allocated while `ATHLYS_CI_READY` is unset or not `true`; the small Athlys1-only test job remains active.
- No routine CLI install/scaffold occurs.
- Manual CLI audits remain available per repository.
- A second independent CI provider, durable evidence storage, signed attestations, and SBOM production remain future gates.
