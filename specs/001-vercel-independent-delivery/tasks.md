# Tasks — Vercel-independent Athlys delivery

- [ ] T001 [BLOCKER] Grant heat936 access to the existing application source repository `Lijw936/Athlys2`; verify repository identity and PR #90.
- [ ] T002 [BLOCKER] Verify exact application branch and immutable commit SHA; inspect package/build configuration and current visual-refinement diff.
- [ ] T003 [BLOCKER] Connect Cloudflare Pages-capable account/token; confirm account and Pages permissions.
- [ ] T004 Create isolated non-production Pages project; do not change DNS or production.
- [ ] T005 Inspect heat936 orchestration/runners; document what is implemented versus bootstrap-only.
- [ ] T006 Implement source-SHA-bound CI build/test workflow in the appropriate repository after inspecting its current conventions.
- [ ] T007 Build and smoke-test Coach, Athlete, and Club web/PWA preview.
- [ ] T008 Build Android APK on a compatible runner and produce SHA-256 checksum.
- [ ] T009 Build Windows and macOS desktop installers on compatible runners.
- [ ] T010 Build Athlys Club Windows installer separately.
- [ ] T011 Verify role boundaries, auth, app behavior, Supabase configuration unchanged, and no vitrine changes.
- [ ] T012 Prepare draft release with artifacts, checksums, logs, and source provenance.
- [ ] T013 [SEPARATE APPROVAL REQUIRED] Production hosting/DNS cutover.
- [ ] T014 [SEPARATE APPROVAL REQUIRED] Publish public release.

## Current execution evidence

- heat936 GitHub account: authenticated and can administer heat936/Athlys1..6.
- heat936/Athlys1..6: each inspected repository is currently bootstrap-only; the app source is not present in those repositories.
- Lijw936/Athlys2: inaccessible to heat936 connection (404).
- Cloudflare saved integrations: both report no zones visible to their tokens; Pages deployment action not exposed.
- Render workspace: no services returned.
- Production deployment, DNS changes, merges, and public releases: not performed.
