# Consolidated six-repository CI architecture

Status: implemented in the draft feature branch; first end-to-end execution is pending.

## Objective
Reduce six independent GitHub-hosted jobs to one consolidated runner for routine integrated verification while retaining an on-demand component/Spec Kit audit in each repository.

## Execution model
- Athlys1 owns the consolidated PR workflow.
- One Ubuntu 24.04 runner checks out the six allowlisted repositories and executes `node --test` once per repository.
- Athlys2–Athlys6 expose manual-only component and official Spec Kit CLI audits. They do not start a runner for every ordinary PR push.
- The consolidated workflow cancels superseded runs for the same PR/ref and uses path filters to ignore irrelevant changes.
- Each checkout records its resolved commit SHA so the six-source set is auditable.

## Trigger and freshness limitation
The consolidated workflow automatically runs when the Athlys1 PR is opened or updated. If only Athlys2–Athlys6 change, the operator must start the consolidated workflow from the Athlys1 Actions tab using `workflow_dispatch`. A future authenticated GitHub App dispatcher can automate that event fan-out, but no cross-repository credential is provisioned and no secret is embedded in this implementation.

## Security
- Read-only `contents: read` permission.
- Checkout credentials are not persisted.
- No PAT, GitHub App private key, production secret, deploy permission, or release permission is required.
- Only the six named public repositories and their integration branch are checked out.
- Manual Spec Kit audit is pinned to upstream commit `979b0a3c1277283371c9901ad0eed04b64a99997`.

## Acceptance
- One consolidated runner executes all six test suites.
- Any failed suite fails the single consolidated check.
- Superseded runs are cancelled.
- No routine CLI install/scaffold occurs.
- Manual CLI audits remain available per repository.
- Cross-repository dispatch and a second independent CI provider remain explicitly out of scope until credentials/infrastructure are approved.
