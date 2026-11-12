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
