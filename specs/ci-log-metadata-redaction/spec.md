# CI private metadata redaction — specification

## Problem
Consolidated CI diagnostics can disclose private component repository identifiers and immutable commit revisions through checkout action output. The current public component lock also contains these identifiers and revisions.

## Goal
Reduce accidental disclosure in workflow logs immediately, while defining the required end state for private metadata storage.

## Requirements
1. Before any private component checkout, register each component short name, full repository identifier, and immutable commit SHA with the GitHub Actions log masking command.
2. Do not print private repository identifiers or immutable commit SHAs in newly added diagnostic output.
3. Preserve immutable revision pinning, least-privilege read-only checkout credentials, and the six-component integration test.
4. The authoritative component lock must ultimately be stored in an approved protected secret store, not committed to a public repository.
5. The workflow must fail closed if protected lock data is absent or malformed; it must not silently fall back to a public copy.
6. Never place credentials or secret values in source files, workflow logs, summaries, or artifacts.

## Acceptance criteria
- The workflow registers masks before any private checkout step.
- A PR CI run confirms the workflow parses and both existing test paths remain functional.
- The remaining public-lock exposure is explicitly tracked as unresolved until a repository Actions secret can be provisioned.
- No merge, deployment, release, DNS, or database change is part of this work.

## Security boundary
GitHub log masking is defense in depth, not a substitute for secret storage. It does not remove values already committed to Git history, and it does not guarantee redaction from artifacts or summaries. The public component lock remains an acknowledged exposure until replaced by protected secret-backed configuration.


## Verification snapshot — 2026-11-13

- Fresh PR workflow run #129 on 2026-11-12, source branch head `ed32b69eaa30df56f83487cc6e19b0b12c624ab5`: [run 43247445216](https://github.com/heat936/Athlys1/actions/runs/43247445216).
- The `Read immutable component lock` step executed all three `::add-mask::` directives (component alias, full repository identifier, immutable revision) before the five private checkout steps.
- Both jobs succeeded. The dedicated orchestrator job passed 23/23 tests. The consolidated evidence artifact records 27/27 Athlys1, 4/4 Athlys2, 5/5 Athlys3, 6/6 Athlys4, 5/5 Athlys5 and 6/6 Athlys6 tests: 53 distinct tests passed. The separate cross-component suite passed 4/4 and is already included in Athlys1's 27.
- Independently checked all eight SHA-256 entries in the consolidated evidence artifact; 8/8 matched. Artifact ZIP digest: `sha256:fba28267e475ff2104b2f1cdb3d97ceaf0d0c4c32924547da4f0cf218780acc3`.
- The protected-secret migration remains blocked: the connected integration does not expose Actions secret/variable management. The public component lock and historical artifacts remain unresolved; no secret value was read or changed.
