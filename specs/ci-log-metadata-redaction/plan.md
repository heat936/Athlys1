# Plan — CI private metadata redaction

1. Inspect the current consolidated workflow and component lock.
2. Add GitHub Actions log masks for component aliases, repository identifiers, and immutable revisions immediately after lock validation and before checkout steps.
3. Preserve the existing checkout token scope, immutable refs, test execution, SBOM generation, and artifact behavior.
4. Trigger and inspect PR CI; record exact run, commit, job status, and test counts.
5. Complete the full privacy remediation only after the lock is moved to a protected repository Actions secret and all public references/artifacts are sanitized.
6. Verify the protected-secret workflow without exposing the secret value.

## Current execution boundary
The connected GitHub integration supports branch/file/PR/workflow operations but does not expose repository Actions secret or variable management. Therefore step 5 cannot be completed through the current integration. Do not attempt a raw API workaround or ask the user to paste credentials into chat.


## Execution record — 2026-11-13

Step 4 was verified by PR run #129 at source SHA `ed32b69eaa30df56f83487cc6e19b0b12c624ab5`. Both consolidated jobs succeeded; the mask-registration step ran before private checkouts; the dedicated test job passed 23/23 and the six-component artifact contains 53/53 distinct passing tests (cross-component 4/4 included in Athlys1's 27). All eight artifact checksums were independently verified. Step 5 remains blocked because the connected GitHub integration cannot provision or inspect Actions secrets/variables. No raw API workaround was attempted.
