# Node.js 24 runtime migration for pinned GitHub Actions

Status: implemented on the six-repository CI feature branch; CI verification pending.

## Objective
Remove the GitHub Actions Node.js 20-to-24 forced-runtime compatibility warning without weakening immutable action pinning, least privilege, or evidence collection.

## Scope
Update only the CI workflow files in heat936/Athlys1 through heat936/Athlys6 on branch `spec/ci-independence-bootstrap`:
- Athlys1: `.github/workflows/spec-kit-verification.yml`.
- Athlys2–Athlys6: `.github/workflows/pr-verification.yml` and `.github/workflows/spec-kit-verification.yml`.

No application code, production workflow, secrets, repository settings, merge, or deployment is in scope.

## Requirements
- R1: Every `actions/checkout` reference in scope uses a full 40-character immutable SHA for an upstream release whose action metadata declares `runs.using: node24`.
- R2: Every `actions/setup-node` reference in scope uses a full 40-character immutable SHA for an upstream release whose action metadata declares `runs.using: node24`.
- R3: Every `actions/upload-artifact` reference in scope uses a full 40-character immutable SHA for an upstream release whose action metadata declares `runs.using: node24`.
- R4: `astral-sh/setup-uv` remains pinned to a full SHA; it is a composite action and is not part of the Node 20 warning migration.
- R5: Existing workflow triggers, permissions, concurrency, timeouts, test commands, artifact paths, retention, and secret handling remain unchanged.
- R6: The action inventory records exact versions and SHAs, and all six repositories receive updated workflow references.
- R7: No PR may be merged and no production deployment or release may be triggered by this change.

## Upstream pins verified
- `actions/checkout` v7.0.1 — `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- `actions/setup-node` v7.1.0 — `949feb2413d6458794dcd2491c4babbbce0c15c1`.
- `actions/upload-artifact` v7.0.2 — `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.
- `astral-sh/setup-uv` v5.4.2 — `d4b2f3b6ecc6e67c4457f6d3e41ec42d3d0fcb86`.

The three Node action commits were resolved from official upstream release tags and their `action.yml` metadata was read at the exact commit. Each declares `runs.using: node24`.

## Plan and tasks
1. Inspect all six repository workflow directories and capture the existing blob SHAs.
2. Resolve official upstream release tags to full commit SHAs.
3. Read each pinned action's `action.yml` at that commit and confirm Node 24 runtime.
4. Update only the workflow action references on the existing feature branch; preserve all other workflow behavior.
5. Re-read every changed workflow and confirm no floating Node action references remain.
6. Update the dependency inventory and CI architecture record.
7. Synchronize the six PR branches and verify each component PR check plus the consolidated Athlys1 run.
8. Inspect final diffs and report any remaining warnings or blocked checks.

## Acceptance criteria
- AC1: All 11 workflow files in scope are updated and read back.
- AC2: Every checkout/setup-node/upload-artifact reference uses the exact SHA listed above.
- AC3: Every setup-uv reference is pinned to the approved full SHA.
- AC4: Workflow YAML structure and all non-action behavior are unchanged.
- AC5: GitHub Actions reports successful component test jobs for Athlys1–Athlys6.
- AC6: The consolidated six-component job completes successfully with fresh tests and evidence checksums.
- AC7: The Actions runtime warning for these three action families is absent from the verified run logs.
- AC8: All six PRs remain open and draft; no merge, release, or production deployment occurs.

## Verification evidence
Read-back and workflow-run evidence will be recorded after the updated PR branches execute. Until those checks complete, this change is implemented but not yet verified.
