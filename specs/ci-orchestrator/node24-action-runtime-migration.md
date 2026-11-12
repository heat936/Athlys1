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
- R4: `astral-sh/setup-uv` also uses a full SHA for a release whose action metadata declares `runs.using: node24`.
- R5: Existing workflow triggers, permissions, concurrency, timeouts, test commands, artifact paths, retention, and secret handling remain unchanged.
- R6: The action inventory records exact versions and SHAs, and all six repositories receive updated workflow references.
- R7: No PR may be merged and no production deployment or release may be triggered by this change.

## Upstream pins verified
- `actions/checkout` v7.0.1 — `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- `actions/setup-node` v7.1.0 — `949feb2413d6458794dcd2491c4babbbce0c15c1`.
- `actions/upload-artifact` v7.0.2 — `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.
- `astral-sh/setup-uv` v10.3.3 — `68559e99cc807c1eb7e9238fd43a15bba460eec2` (Node 24).

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
## Verification evidence — first migration run

- Athlys1 consolidated CI run #91: https://github.com/heat936/Athlys1/actions/runs/43228810368 — **success**.
- Athlys2–Athlys6 PR verification runs: #13, #9, #13, #13, and #14 respectively — all **success**.
- Athlys1 orchestrator tests: 23/23 passed.
- Consolidated component evidence: Athlys1 27/27, Athlys2 4/4, Athlys3 5/5, Athlys4 6/6, Athlys5 5/5, Athlys6 6/6 — **53 distinct tests passed**. The separately invoked cross-component TAP file repeats four tests already discovered in Athlys1's suite, so its 4/4 is not double-counted.
- All six component checkouts succeeded. CycloneDX 1.6 source inventory contains six components.
- The eight checksums in `SHA256SUMS` were independently recomputed from the downloaded artifact; all matched.
- Artifact: `athlys-six-component-evidence-...`, GitHub artifact SHA-256 `aac7cc05020df03d5a54ce4f77336ff314251961b242383047813e713594a405`, retained until 2027-02-10.
- The workflow job logs for Athlys1–Athlys6 contain no Node.js 20 deprecation/forced-runtime warning.
- All six PRs remain open and draft. No merge, release, or production deployment occurred.

## Final verification against the refreshed component lock

- Consolidated run #92: https://github.com/heat936/Athlys1/actions/runs/43229604323 — **success**, including both orchestrator and six-component jobs.
- The run consumed the refreshed lock and recorded the current verified heads: Athlys1 `f680b2ab928e04565d4b00ab8b495aa6380a5a3d`, Athlys2 `bb20a50b0f46f114f701bdc6053aae3ea3f145f4`, Athlys3 `2ee4478dc9c1b135f08dc6cf08029e246fd569d7`, Athlys4 `a5400cccc04d202e17b4dbcaa08b926f6ec965d4`, Athlys5 `22314d1e3344a345c37308acdb2e4b8362152b2a`, Athlys6 `efc18ba89d91c6c92659af8ea90d077b203050d8`.
- TAP suites: 53 distinct tests passed, zero failures. Four cross-component tests are also written to a separate TAP file but are already discovered by the Athlys1 suite and are not double-counted.
- The final artifact contains all six TAP files, the separate cross-component TAP, the component manifest, CycloneDX 1.6 inventory with six components, and eight SHA-256 entries. All eight checksums were independently recomputed and matched.
- Final artifact digest: `sha256:9891e504d35acdd67fcaf86a530b9ccbc3bac13312e72533f6774a8c950999f8`; retention through 2027-02-10.
- No Node.js 20 deprecation/forced-runtime warning appears in either final consolidated job log.
- All six PRs remain open and draft. No merge, release, or production deployment occurred.

All acceptance criteria AC1–AC8 are now verified.


## Follow-up correction — setup-uv runtime

A subsequent inspection of the exact pinned `action.yml` revealed that setup-uv v5.4.2 actually declared `runs.using: node20`; the earlier statement that it was a composite action was incorrect. The five manual Spec Kit workflows in Athlys2–Athlys6 were therefore migrated to setup-uv v10.3.3 at `68559e99cc807c1eb7e9238fd43a15bba460eec2`. The exact action metadata at that commit declares Node 24. All five component PR checks passed after the update. The new supply-chain workflow also pins and scans this action source.
