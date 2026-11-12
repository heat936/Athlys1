# CI Orchestrator

> Athlys CI/CD Independence — specification-driven component.

## Mission
Validates immutable run identity, rejects missing or unknown checks, distinguishes infrastructure failures from product failures, and emits deterministic SHA-256 evidence.

## Implemented vertical slice
- \`src/orchestrator.mjs\` — immutable run validation, fail-closed result aggregation, and evidence-manifest integrity verification.
- \`test/orchestrator.test.mjs\` — deterministic Node.js built-in tests.
- \`.specify/memory/constitution.md\` and \`specs/001-ci-orchestrator/\` — engineering constitution, specification, plan, and task tracking.
- \`.github/workflows/spec-kit-verification.yml\` — consolidated GitHub Actions workflow for fresh Ubuntu 24.04 / Node.js 22 component validation and the optional six-component suite. The workflow is named for the Spec Kit verification branch history; its current jobs execute CI validation, not the Spec Kit CLI scaffold.

## Verification evidence
- Latest completed consolidated workflow run: [run #87](https://github.com/heat936/Athlys1/actions/runs/43228008056), source SHA \`2a330424c38d0de23f1428233e2c0ea736dd2781\`.
- Both jobs succeeded; all six immutable component checkouts completed.
- **53/53 distinct tests passed**: Athlys1 27/27 (including the separately invoked cross-component suite), Athlys2 4/4, Athlys3 5/5, Athlys4 6/6, Athlys5 5/5, Athlys6 6/6.
- The standalone orchestrator job reported **23/23 passed**.
- Consolidated evidence artifact SHA-256: \`af8cdb1efbc8bf8727d0729316979846686adda1c651e4746dcebb5831439ba6\`.
- Run #87 used earlier v4 GitHub Actions references. The current branch has since upgraded checkout/setup-node/upload-artifact to immutable v7 commit pins; **that newer workflow revision still requires its own successful run**.
- The previous run emitted a Node.js 20 deprecation warning for the earlier v4 action references. The current pinned v7 action metadata targets Node.js 24; verify this on the next run.
- The official Spec Kit CLI bootstrap was separately recorded as completed in the component task history, pinned to upstream commit \`979b0a3c1277283371c9901ad0eed04b64a99997\`. It is not executed by the current consolidated CI workflow.

## Not yet production-ready
A second independent CI provider, full threat-model review, durable evidence storage, signed release attestations, dependency-complete production SBOMs, and complete external dispatch governance remain open. The current CycloneDX source inventory is not a dependency-complete production SBOM. No merge, release publication, or deployment is performed by this repository.

## Security hardening
Evidence manifests expose a SHA-256 integrity verifier that detects changes to the canonical manifest payload. This is integrity checking, not a digital signature or signed build attestation.
