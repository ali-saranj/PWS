---
name: "SDLC: Build"
description: "Phase 3: Isolated Subagent Execution & Strict TDD"
category: "SDLC Orchestrator"
---

Execute Phase 3 of the SDLC Orchestrator Suite using the `sdlc-build` skill.

1. Ensure workspace isolation on a clean feature branch or worktree (`_engine-using-git-worktrees`). Verify baseline tests pass.
2. Iterate sequentially through `openspec/changes/<change-name>/tasks.md` with subagents (`_engine-subagent-driven-development`).
3. For each task, enforce strict RED-GREEN-REFACTOR (`_engine-test-driven-development`), scope discipline, Chesterton's Fence, and anti-rationalization guardrails.
4. Conduct two-stage verification (Spec compliance + `_engine-code-review-and-quality`).
5. Check off the task in `tasks.md` and commit.
