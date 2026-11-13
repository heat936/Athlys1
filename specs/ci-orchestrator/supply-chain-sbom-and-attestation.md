# Supply-chain SBOM and signed provenance

Status: implemented and verified on `spec/ci-independence-bootstrap`  
Date: 2026-11-12  
Owner: Athlys CI orchestrator (single accountable integration owner)

## 1. Decision and objective

Create a repeatable, evidence-backed CycloneDX 1.6 software bill of materials for the six-component Athlys CI source bundle and its build environment, then produce verifiable GitHub/Sigstore attestations for the source-bundle digest and its SBOM.

## 2. Scope

In scope:
- Six immutable source checkouts selected by `specs/ci-orchestrator/component-lock.json`.
- Package-manager metadata found by Syft in the six source trees and pinned GitHub Action source trees.
- Exact GitHub Action release pins and commits used by the CI pipeline.
- Spec Kit CLI source at commit `979b0a3c1277283371c9901ad0eed04b64a99997`, plus the exact Python packages installed for the audit.
- Ubuntu runner package inventory, OS release, Node/npm, Python, uv, Spec Kit CLI and Syft versions.
- CycloneDX 1.6 SBOM, source snapshot digest, SHA-256 manifest and signed attestations.
- Verification of signatures with GitHub CLI after creation.

Out of scope:
- Merging any PR, changing `main`, publishing a release, deploying production, changing secrets or Supabase.
- Claiming this CI inventory is an SBOM for an Athlys production binary/container; no such artifact is built by this workflow.
- Publishing private repository names, private commit IDs, private source paths, or the private source archive in the public Athlys1 repository's artifacts/attestations.

## 3. Privacy and publication model

Athlys1 and Athlys2 are public; Athlys3–Athlys6 are private. The workflow runs in public Athlys1, where GitHub artifact attestations are available on current non-legacy plans. Therefore:
- The full internal source inventory and source archive remain runner-local and are never uploaded.
- The public SBOM uses opaque component identifiers and source-tree SHA-256 hashes; it omits private repository names, private commit IDs, and private paths.
- Only the sanitized SBOM and test/evidence files that do not disclose private source identity may be uploaded.
- The source archive itself is not uploaded; its digest is the subject of signed attestations.
- Existing historical CI artifacts may already contain private repository identifiers; this change does not delete historical evidence. Any purge requires a separate explicit decision.

## 4. Requirements

- R1: All six component checkouts use the exact SHA values in the component lock; reject non-40-hex SHAs.
- R2: Syft is downloaded at a fixed release and its binary SHA-256 is checked before execution.
- R3: Syft scans all six component source trees and pinned action/Spec Kit source trees.
- R4: The inventory includes all detected package-manager components and dependency edges, plus installed Ubuntu dpkg packages and exact Python tool-environment packages.
- R5: Build metadata records exact runner, Node/npm, Python, uv, Spec Kit CLI, Syft and action versions/SHAs.
- R6: A private/internal source inventory retains repository/commit mapping on the runner only; public SBOM redacts these identifiers.
- R7: The public SBOM validates as CycloneDX 1.6 and has unique component references and resolvable dependency references.
- R8: The source archive is hashed and never uploaded as an Actions artifact.
- R9: GitHub Artifact Attestations generate both SLSA provenance for the source archive and an SBOM attestation binding the same source archive to the public SBOM.
- R10: Attestation permissions are isolated to a push/workflow_dispatch workflow on the dedicated feature branch; no write-capable attestation token is granted to pull_request jobs.
- R11: `gh attestation verify` validates the provenance and CycloneDX SBOM predicate using the expected repository and signer workflow.
- R12: No merge, release, production deployment, secret change, or database change occurs.

## 5. Tool pins

- `actions/checkout` v7.0.1 — `3d3c42e5aac5ba805825da76410c181273ba90b1` (Node 24).
- `actions/setup-node` v7.1.0 — `949feb2413d6458794dcd2491c4babbbce0c15c1` (Node 24).
- `actions/upload-artifact` v7.0.2 — `cf430e030ddbb5b0abf93d22962f4752f3646cd9` (Node 24).
- `astral-sh/setup-uv` v10.3.3 — `68559e99cc807c1eb7e9238fd43a15bba460eec2` (Node 24; replaces the previously pinned Node 20 action).
- `actions/attest` v4.2.2 — `1e69f48acb82d1966a394da916b4c1698aa569d6` (Node 24).
- Syft v1.57.1 — release binary SHA-256 `bf52519eb57f675d47c07d43213cb6dff6449f3d6d1147ff6701ed91f44eef0c`; source release commit `a0c0d3890a9d79421c403e8fcadec50a2e55bf21`.
- Spec Kit CLI source — `979b0a3c1277283371c9901ad0eed04b64a99997`.

## 6. Execution plan

1. Upgrade the five manual Spec Kit workflows to Node-24-compatible setup-uv v10.3.3.
2. Add a deterministic CycloneDX aggregation/sanitization utility and unit tests.
3. Add a dedicated push/workflow_dispatch supply-chain workflow restricted to `spec/ci-independence-bootstrap`.
4. Checkout the six immutable source commits and clone action/Spec Kit sources at exact commits.
5. Install pinned Syft, audit the Spec Kit CLI, resolve and record its actual Python dependency set, inventory runner packages and tool versions.
6. Generate the internal source inventory and source archive; generate the sanitized public SBOM.
7. Validate SBOM schema-level invariants, hashes and dependency references.
8. Create SLSA provenance and SBOM attestations; verify both with GitHub CLI.
9. Upload only sanitized SBOM and non-sensitive evidence.
10. Inspect run logs, artifact contents, attestations, PR state and final diffs; update this specification with evidence.

## 7. Acceptance criteria

- AC1: The five setup-uv workflows pin v10.3.3 at the exact SHA and its action metadata declares Node 24.
- AC2: Syft binary digest matches the pinned SHA before execution.
- AC3: All six component source checkouts and all pinned tool-source checkouts match their immutable commits.
- AC4: CycloneDX 1.6 SBOM includes source snapshot hashes, detected package components, action package-lock dependencies, Spec Kit Python dependencies, OS packages and exact build tool versions.
- AC5: Public SBOM contains no private repository names, private commit SHAs, private file paths or source archive.
- AC6: SBOM validation passes with unique bom-ref values and dependency references that resolve.
- AC7: Source archive SHA-256 is recorded and archive is not in uploaded artifact contents.
- AC8: GitHub generates both provenance and SBOM attestations; CLI verifies both with expected repo/workflow identity.
- AC9: Workflow logs/artifacts contain no secret values.
- AC10: All six PRs remain open and draft; no merge/release/deploy occurred.

## 8. Verification and limitations

- GitHub artifact attestations are supported on public repositories for current GitHub plans; private/internal repository attestations require GitHub Enterprise Cloud. This workflow therefore signs only a sanitized SBOM in public Athlys1.
- The attestation proves the source archive digest and the CI workflow identity; it does not prove a production release or binary build.
- The pinned upstream Spec Kit source has no committed `uv.lock`. Athlys now commits `specs/ci-orchestrator/spec-kit-uv.lock.sha256`, pinning the SHA-256 of the reviewed 225,185-byte lock captured in the verified SBOM artifact. The workflow resolves the lock and fails closed unless its bytes match this fingerprint, then installs with `uv sync --locked`. This is a drift-detection gate, not equivalent to storing the complete `uv.lock` in Git: resolution still occurs before the hash check, and any changed dependency graph requires an explicit reviewed fingerprint update. The full lock remains preserved in the signed public SBOM artifact.
- Syft catalogs package metadata and lockfiles it recognizes. Bundled JavaScript dependencies not separately represented by package manifests/lockfiles may require additional binary-level analysis.
- Ubuntu hosted-runner image is mutable; the exact image and installed package inventory are captured per run, but the GitHub-hosted runner image itself is not pinned.


## 9. Verified execution evidence

Run: [Athlys supply-chain SBOM and signed attestations #?](https://github.com/heat936/Athlys1/actions/runs/43232033947)  
Commit: `f77e65348e1faa2e30e1dd3129ce6d837a783192`  
Result: **success** (all workflow steps, both attestations, both CLI verification commands and artifact upload).

- Consolidated CI for the same commit: [run](https://github.com/heat936/Athlys1/actions/runs/43232043419) — **success**.
- All five private component checkouts succeeded at the immutable commits in `component-lock.json`.
- All six component test suites passed: 53 distinct tests, zero failures (the four cross-component tests are already included in Athlys1's recursive suite).
- Syft v1.57.1 binary SHA-256 was verified against the official Linux amd64 release asset digest before execution.
- SBOM: CycloneDX 1.6; 2,281 components; 307 dependency records; 1,213 Ubuntu dpkg packages and 198 Python packages are among the catalogued components. All dependency references resolve and all component `bom-ref` values are unique.
- The public SBOM contains no private repository identifiers or private source commit SHAs. The full source manifest and source archive remained runner-local.
- The Spec Kit resolved lock is included in the public artifact as `spec-kit-uv.lock` (225,185 bytes), SHA-256 `39ad5cf0b2f948c019e6465e08c90c980cccb8bcdbcedd903e446a87bf8161bc`. The same digest is now committed as `specs/ci-orchestrator/spec-kit-uv.lock.sha256`; the workflow rejects any newly resolved lock whose digest differs.
- Public artifact: `athlys-public-supply-chain-sbom-f77e65348e1faa2e30e1dd3129ce6d837a783192`, artifact ID `13950936567`, artifact digest `sha256:f4ec52ec30b74936bca8df4f82b9ef50e1f04478ec39972188d46cb609a7dac4`, retained until 2027-02-10.
- Source archive digest (archive not uploaded): `sha256:b82c5bdaebe9947d12f71c209c50999608a27c009689ddc1ff345c95e4dcd513`.
- SLSA provenance attestation: [66718907](https://github.com/heat936/Athlys1/attestations/66718907); Sigstore Rekor entry 3833651485.
- CycloneDX SBOM attestation: [66718927](https://github.com/heat936/Athlys1/attestations/66718927); Sigstore Rekor entry 3833651757.
- Both attestations were signed through the Sigstore Public Good instance and uploaded to GitHub. The workflow's `gh attestation verify` commands succeeded for the SLSA provenance and `https://cyclonedx.org/bom` predicate.
- The setup-uv cache warning was removed by disabling cache for the ephemeral lock-generation job.

### Internal companion

A private enriched copy of the SBOM can map opaque source components to repository names and exact commits. It is not uploaded to GitHub and is not itself directly signed; the signatures cover the sanitized public SBOM and source archive digest. Do not publish the internal companion.

### Final governance state

All six PRs remain open and draft. No merge, release, production deployment, secret mutation or Supabase change occurred. The public SBOM is a CI source-bundle/build-environment inventory, not a production binary/container/release SBOM.
