# CI Orchestrator

> Athlys CI/CD Independence — specification-driven engineering.

## Mission

Public control plane: coordinate validations across repositories, bind every result to an immutable source SHA, classify infrastructure failures separately from code failures, and enforce human approval gates. No credentials, private endpoints, or production secrets belong here.

## Governance

- GitHub Spec Kit is the required development framework.
- Every validation is bound to an immutable repository, ref, and commit SHA.
- A cache hit is not a fresh test execution; skipped checks are never reported as passed.
- Infrastructure startup failures are distinct from test or build failures.
- Least privilege, isolated execution, and secret minimization are mandatory.
- No merge, public release, deployment, DNS change, Supabase secret change, or migration without explicit human authorization.
- Preserve audit evidence: workflow, job, runner image, toolchain versions, commands, exit codes, logs, and artifact digests.

## Status

Repository bootstrap. The detailed constitution, specification, plan, and task breakdown will be maintained in the Spec Kit artifacts.

## Scope boundary

This repository is one component of the Athlys CI/CD Independence program. Cross-repository interfaces are governed by the central architecture specification; component-specific implementation must not modify another component's ownership boundary.
