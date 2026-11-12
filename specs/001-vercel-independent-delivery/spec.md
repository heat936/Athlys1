# Specification: Vercel-independent Athlys application delivery

**Status:** blocked pending source-repository and Cloudflare access  
**Owner:** Athlys delivery orchestrator  
**Scope:** Athlys Coach, Athlete, Club web/PWA shells and desktop/mobile release artifacts only.

## Problem

Vercel is unavailable for the current delivery window. Athlys needs an independent build and hosting path without changing application behavior, athlete data, authentication, roles, permissions, calculations, integrations, or the public showcase.

## Decision

Adopt a split delivery architecture:
- Cloudflare Pages for static web/PWA assets, using a `pages.dev` preview first and a custom domain only after explicit DNS authorization.
- GitHub Actions / isolated runners for reproducible builds and tests, with immutable source SHA provenance.
- GitHub Releases for signed/versioned Android APK, Windows installers, macOS installer, and Athlys Club Windows installer.
- Existing Supabase project remains the backend and source of truth; no schema, RLS, secrets, or data changes are part of this migration.

## Non-goals

- No production deployment, domain/DNS change, public release, merge to a default branch, billing change, or Supabase mutation.
- No redesign of the public vitrine.
- No migration to Base44 or replacement/rewrite of the Athlys app.
- No copying CI infrastructure repositories into an application repository.

## Preconditions / verified blockers

1. The current application source is understood to be `Lijw936/Athlys2`, with the app-only visual refinement in PR #90. The `heat936/Athlys1..6` repositories are CI/orchestration infrastructure, not the application source.
2. The `heat936` GitHub connection can access its six infrastructure repositories, but `Lijw936/Athlys2` returned 404 under the `heat936` connection. Therefore no source transfer or application code change can safely be made from this account yet.
3. The connected Cloudflare integrations report no zones visible to their tokens. The available Cloudflare connector exposes DNS operations but no Pages project/deployment operation. No Pages deployment can be claimed from this session.
4. The connected Render workspace currently returns no services. Render is not an active fallback target.
5. Earlier GitHub Actions runs for the application work failed at startup before jobs were created; this is an infrastructure failure, not a passing or failing test result.

## Functional requirements

- FR-01: Build from the exact approved application repository, branch, and commit SHA.
- FR-02: Keep Coach, Athlete, and Club entrypoints distinct and preserve role boundaries.
- FR-03: Publish a non-production Cloudflare Pages preview before any production cutover.
- FR-04: Build Android, Windows, macOS, and Club Windows artifacts in separate platform-compatible jobs.
- FR-05: Attach checksums, version, source SHA, build logs, and test evidence to release artifacts.
- FR-06: Preserve existing Supabase endpoints/configuration and avoid printing secrets in logs.
- FR-07: Keep the vitrine untouched.
- FR-08: Require explicit human approval before merge, production deployment, DNS/domain changes, or public release.

## Non-functional requirements

- Reproducible builds; least-privilege credentials; no long-lived secrets in source.
- CI results must distinguish startup failure, job failure, skipped checks, and success.
- Preview and production must be isolated.
- Rollback must point to the previous immutable artifact/deployment.
- The mobile and desktop app flows must remain usable on their target platforms.

## Acceptance criteria

- AC-01: heat936 has read access to the exact application repository and the approved visual-refinement branch/PR.
- AC-02: Cloudflare Pages account/project access is verified and a preview project is created without changing production DNS.
- AC-03: A successful build and test run is tied to an immutable source SHA.
- AC-04: Preview URL is smoke-tested for Coach, Athlete, and Club entrypoints.
- AC-05: APK and desktop installers are generated and checksummed in platform-compatible runners.
- AC-06: Supabase configuration and application behavior are unchanged.
- AC-07: No production release occurs without separate explicit authorization.

## Rollback

Disable or delete only the non-production preview project if preview validation fails. For a later authorized production cutover, preserve the previous hosting target and DNS values before changes; rollback by restoring the prior DNS/hosting target. Do not execute this production rollback plan without authorization.
