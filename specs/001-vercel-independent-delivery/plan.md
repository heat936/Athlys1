# Implementation plan

## Phase 0 — access and provenance (blocking)
1. Grant the heat936 GitHub identity read/write access to the existing application repository `Lijw936/Athlys2`, or explicitly approve a repository transfer/mirror.
2. Verify the intended application repository, source branch, PR #90, commit SHA, and all changed files.
3. Confirm the source repository remains the single source of truth; do not treat heat936/Athlys1..6 as app source.

## Phase 1 — Cloudflare preview capability (blocking)
1. Connect a Cloudflare token/account with Pages project read/write permissions and the correct account scope.
2. Confirm account identity and Pages capability. The current saved integrations do not expose a zone and the current connector does not expose Pages deployment.
3. Create a separate non-production Pages project only after access is verified.
4. Configure build command/output directory from the actual app repository after inspecting its package scripts and build configuration.
5. Deploy preview to pages.dev only; do not alter DNS.

## Phase 2 — CI and artifacts
1. Inspect current runner/orchestrator repositories and workflows; the current repositories are bootstrap-only and must not be assumed operational.
2. Establish a workflow that binds every build/test result to repository + ref + commit SHA.
3. Run app tests and build; classify startup failures separately.
4. Build APK and Windows/macOS artifacts on compatible runners; keep Athlys Club Windows as a distinct artifact.
5. Generate SHA-256 checksums and attach logs/provenance to a draft release.

## Phase 3 — verification
1. Smoke-test Coach, Athlete, Club, auth entrypoints, PWA install/cache, and responsive layouts on preview.
2. Verify that no backend/schema/RLS/auth settings changed.
3. Inspect artifacts and checksums.
4. Present preview URL and test evidence for review.

## Phase 4 — optional production cutover
Requires separate explicit approval. Preserve existing DNS and hosting configuration, perform a staged cutover, smoke-test, and maintain a rollback route. This phase is not authorized by the current task.
