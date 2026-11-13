# Plan — authorized private-source validation

1. Read the Athlys constitution and the relevant existing Spec Kit specification, plan and task records.
2. Inspect the failing workflow, PR run, job steps and raw checkout log.
3. Verify that the exact pinned commit and required npm scripts exist in `heat936/Athlys2`, and confirm the existing read-only secret already checks out that repository in consolidated CI.
4. Change only the repository owner and matching pre-checkout mask in `.github/workflows/athlys-private-app-validation.yml`; preserve the pinned SHA, secret reference, permissions, commands and artifact policy.
5. Inspect the next PR Actions run, including checkout, install, release verification, web build and logs.
6. If verification fails, revert only this workflow change and retain the evidence; do not broaden permissions or introduce a cross-account fallback.

## Execution boundary
All GitHub connector operations use the connected `heat936` account. The Actions secret value is neither readable nor modifiable through the available integration. No token is requested in chat and no raw API workaround is attempted.
