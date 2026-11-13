# Authorized private-source validation — specification

## Status
The workflow owner correction is implemented on the feature branch. A fresh PR run is required to verify the checkout, release tests and web build.

## Problem
The private-application validation workflow attempted to clone a source repository under a GitHub owner outside the explicitly authorized `heat936` account. The latest run failed at checkout with GitHub's `Repository not found` response (exit code 128). The exact immutable source commit is present in `heat936/Athlys2`; the existing `ATHLYS_READ_TOKEN` also successfully checked out `heat936/Athlys2` in the consolidated CI workflow.

## Goal
Keep private application validation within the authorized `heat936` repository boundary while preserving the exact source revision and existing validation behavior.

## Requirements
1. The workflow must check out the source from `heat936/Athlys2`; it must not use a different GitHub owner.
2. Preserve the existing immutable source commit SHA exactly.
3. Preserve the existing Actions secret reference, ephemeral checkout path, `persist-credentials: false`, and cleanup behavior.
4. Preserve the release verification and web build commands without weakening their failure handling.
5. Do not log, expose, create, rotate or modify any secret or token.
6. Do not add fallback repositories or mutable branch refs; checkout must fail closed if the pinned source cannot be retrieved.

## Acceptance criteria
- The workflow masks `heat936/Athlys2` before checkout and uses that exact repository owner.
- The pinned commit is retrievable from `heat936/Athlys2`.
- A fresh PR Actions run completes checkout, dependency installation, `npm run verify:release`, and `npm run build:web`.
- No other GitHub account is used by this workflow.
- No merge, deployment, release, DNS, database, branch-protection or secret change is performed.

## Security boundary
The Actions secret value is not available through the connected integration and must never be pasted into chat. This change only corrects the repository owner; it does not change token scope or secret configuration.
