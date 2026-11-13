# Tasks — authorized private-source validation

- [x] Read the Athlys constitution and relevant existing Spec Kit specification, plan and tasks.
- [x] Inspect the failed private-source validation run and confirm the checkout error: `Repository not found`, exit code 128.
- [x] Verify the exact pinned source commit is available in `heat936/Athlys2`.
- [x] Verify that the pinned source contains `verify:release` and `build:web` npm scripts.
- [x] Confirm the existing consolidated workflow successfully checks out `heat936/Athlys2` with the same Actions secret reference.
- [x] Retarget the private-source workflow and its pre-checkout mask to `heat936/Athlys2`, preserving the immutable source SHA and all other workflow behavior.
- [ ] Verify a fresh PR Actions run completes checkout, dependency installation, release verification and web build.
- [x] Make no secret, production, DNS, database, merge, release or branch-protection changes.

## Rollback
Revert the single workflow-owner change if the fresh run does not validate the same immutable source revision. Do not replace the pinned SHA or fall back to another account.
