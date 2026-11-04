---
name: "SDLC: Ship"
description: "Phase 5: Polish, Security Hardening, Verification & Spec Archive"
category: "SDLC Orchestrator"
---

Execute Phase 5 of the SDLC Orchestrator Suite using the `sdlc-ship` skill.

1. Eliminate accidental complexity and AI slop on branch diff (`_engine-code-simplification`).
2. Audit security, auth, input validation, and race conditions (`_engine-security-and-hardening`).
3. Run complete build and test suite, showing real terminal output evidence (`_engine-verification-before-completion`).
4. Execute `openspec archive <change-name> --yes` to merge delta specs into `openspec/specs/` and archive the change.
