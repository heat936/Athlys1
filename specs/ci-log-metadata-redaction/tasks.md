# Tasks — CI private metadata redaction

- [x] Inspect consolidated workflow and public component lock.
- [x] Add log masks for component names, full repository identifiers, and immutable revisions before private checkouts.
- [ ] Verify the masking change in a fresh PR Actions run.
- [ ] Provision protected repository secret containing the immutable component lock through an approved GitHub secret-management interface.
- [ ] Remove the committed public component lock and migrate workflow parsing to the protected secret.
- [ ] Ensure missing/malformed secret fails closed without fallback.
- [ ] Sanitize summaries, source inventory, and downloadable artifacts; verify no private identifiers or revisions remain.
- [ ] Re-run consolidated CI and supply-chain attestations; inspect logs and artifacts for disclosure.
- [ ] Record residual risk and obtain security review.

## Blocker
The current connected GitHub toolset does not expose repository Actions secret/variable creation or update. The public lock is therefore still present and the remediation is partial. Do not mark the protected-secret migration complete until it is actually configured and verified.
