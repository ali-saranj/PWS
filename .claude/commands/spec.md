---
name: "SDLC: Spec"
description: "Phase 2: Living Specification & Atomic Task Breakdown"
category: "SDLC Orchestrator"
---

Execute Phase 2 of the SDLC Orchestrator Suite using the `sdlc-spec` skill.

1. Create or load the active change inside `openspec/changes/<change-name>/`.
2. Generate `proposal.md`, `design.md`, and delta specs under `specs/<domain>/spec.md` with strict `ADDED/MODIFIED/REMOVED` requirements and `WHEN/THEN` scenarios (`_engine-spec-driven-development`).
3. Generate bite-sized atomic tasks (2-5 mins each) with exact file paths, test scenarios, and terminal verification commands in `openspec/changes/<change-name>/tasks.md` (`_engine-writing-plans`).
