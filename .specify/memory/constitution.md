# Athlys Engineering Constitution

## Product and safety principles
- Athlys is an aide à la gestion de la charge: « l'entraîneur décide, l'IA explique ». It is not a medical diagnosis or medical-prevention product.
- Preserve athlete/coach role boundaries, data minimization, consent, and French/EU privacy constraints.
- Never expose personal data or secrets in CI logs, artifacts, telemetry, or public repositories.

## Engineering principles
- Specification-driven development is mandatory: constitution → specification → clarify → plan → tasks → analyze → implement → verify → review.
- One orchestrator owns cross-component decisions; each repository owns only its declared component boundary.
- Every run is pinned to an immutable source SHA and versioned contracts.
- Reproducibility, least privilege, isolation, idempotency, bounded retries, and auditable evidence are mandatory.
- Cached, skipped, unavailable, and not-run checks must never be reported as passed or freshly executed.
- Infrastructure failures must be distinguished from code/test/build failures.
- Preserve existing Athlys functionality and user changes; avoid unrelated refactors.

## Release and operations safeguards
- No automatic merge, production deployment, release publication/replacement/deletion, DNS change, Supabase secret change, or database migration.
- Preview and production are distinct; deployment requires explicit authorization and post-deployment verification.
- Secrets are supplied only through approved secret stores and never committed or echoed.
- Every change requires a diff review, tests, security checks, and a rollback strategy appropriate to its impact.

## Quality bar
- Every requirement maps to acceptance criteria and verification evidence.
- Report exact commands, versions, exit codes, test counts, and skipped checks.
- Treat uncertainty and missing evidence explicitly; never claim a check, build, or deployment that was not confirmed.
