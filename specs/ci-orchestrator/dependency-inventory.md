# CI dependency inventory and SBOM boundary

## Purpose

Record the externally supplied CI actions and the application runtime dependencies visible in the six-repository source tree. This is a reproducible dependency inventory, not a claim that the complete GitHub-hosted runner image or every transitive dependency inside third-party actions has been enumerated.

## Application source dependencies

The six component repositories contain only native Node.js ES modules and Node's built-in modules. The reviewed source trees contain no package.json, npm/yarn/pnpm lockfile, Python dependency manifest, Cargo manifest, or Go module file. No third-party application runtime package is declared by these source trees.

The consolidated suite runs on Ubuntu 24.04 with Node.js 22. The GitHub-hosted runner image is managed by GitHub and is not an immutable, fully enumerated part of this source inventory.

## GitHub Actions dependencies

All workflow action references in the six-repository CI slice are pinned to full commit SHAs:

| Action | Version label | Immutable commit |
|---|---|---|
| actions/checkout | v7.0.1 (Node 24) | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| actions/setup-node | v7.1.0 (Node 24) | 949feb2413d6458794dcd2491c4babbbce0c15c1 |
| actions/upload-artifact | v7.0.2 (Node 24) | cf430e030ddbb5b0abf93d22962f4752f3646cd9 |
| astral-sh/setup-uv | v5.4.2 | d4b2f3b6ecc6e67c4457f6d3e41ec42d3d0fcb86 |

The official Spec Kit CLI is installed from the upstream `github/spec-kit` repository at commit `979b0a3c1277283371c9901ad0eed04b64a99997`.

## Evidence and limitations

- `source-inventory.cdx.json` is a CycloneDX 1.6 source-tree inventory. It hashes each file and each repository snapshot at an immutable commit.
- The action pins above make the action entrypoints immutable. The checkout v7.0.1, setup-node v7.1.0, and upload-artifact v7.0.2 action metadata each declare Node.js 24. setup-uv v5.4.2 is a composite action. These pins do not enumerate the transitive packages bundled inside each action.
- Ubuntu runner image contents, GitHub Actions runner internals, hosted tool cache, and transitive action package closure are outside the current CycloneDX source-tree inventory.
- Therefore neither the source-tree inventory nor this document should be described as a dependency-complete build SBOM or release SBOM.
- A release-grade SBOM requires a separately defined build boundary and collection of the actual build environment and transitive action/tool dependencies.

## Review procedure

1. Inspect all six repository trees at the component SHAs recorded in `component-lock.json`.
2. Confirm there are no untracked package-manager manifests or generated dependency directories included in the source inventory.
3. Resolve each action tag in its official upstream repository and pin the exact 40-character commit SHA.
4. Re-run component CI after changing action references.
5. Generate the CycloneDX source inventory only from the six immutable checkouts and retain its SHA-256 evidence.
6. Keep the release-SBOM claim blocked until the full build boundary and transitive dependency closure are captured.
