---
name: "SDLC: Router"
description: "Master Dispatcher: Automatically routes request to discover, spec, build, debug, or ship"
category: "SDLC Orchestrator"
---

Analyze user intent and current project state (git worktree, `openspec/changes/`), then silently route and execute the appropriate SDLC Phase skill:
- `sdlc-discover` (Ideation, grilling, interface design)
- `sdlc-spec` (OpenSpec proposal, delta specs, tasks.md)
- `sdlc-build` (Subagents, worktrees, strict TDD, two-stage review)
- `sdlc-debug` (Triage, systematic debug, reproduction test)
- `sdlc-ship` (Code simplification, security audit, verification evidence, spec archive)
