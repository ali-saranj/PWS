# AGENTS.md — Master Constitution & Engineering Architecture

This document is the Single Source of Truth and Master Constitution for all AI agents working in this repository.
By default, the agent **ALWAYS** loads and operates through the **SDLC Orchestrator Suite (`sdlc-router`)**.

---

## Part 1: SDLC Master Constitution & Unified Orchestrator

Whenever any software engineering, feature development, bug fix, refactoring, or architectural task is received—whether formulated in English, casual conversation, or Persian—the agent automatically routes the task through the SDLC Orchestrator Suite.

### 1. Automatic Intent Routing Table

| Natural User Intent / Phrases (English & Persian) | Project State Trigger | Active Skill | Invisible Background Engines |
| :--- | :--- | :--- | :--- |
| • "I want to add a feature..."<br>• "How should we design..."<br>• "یک قابلیت جدید می‌خوام"<br>• "به نظرت چطور اینو پیاده کنیم؟"<br>• "ایده دارم برای..." | Early idea, no approved spec, ambiguous scope | **`sdlc-discover`**<br>(`/discover`) | • `_engine-grill-me` (Matt Pocock)<br>• `_engine-brainstorming` (Superpowers)<br>• `_engine-ubiquitous-language` (Matt Pocock)<br>• `_engine-design-an-interface` (Matt Pocock) |
| • "Plan this feature"<br>• "Write the spec / tasks"<br>• "این قابلیت رو پلن و اسپک کن"<br>• "تسک‌ها رو بشکن و بنویس" | Discovery approved, clear architectural direction | **`sdlc-spec`**<br>(`/spec`) | • `OpenSpec` (`proposal`, `specs/`, `tasks.md`)<br>• `_engine-spec-driven-development` (Addy Osmani)<br>• `_engine-writing-plans` (Superpowers) |
| • "Build it" / "Implement tasks"<br>• "Let's code"<br>• "تسک‌ها رو شروع کن و کد بزن"<br>• "تسک بعدی رو پیاده‌سازی کن" | Approved `tasks.md` exists with pending tasks (`- [ ]`) | **`sdlc-build`**<br>(`/build`) | • `_engine-using-git-worktrees` (Superpowers)<br>• `_engine-subagent-driven-development` (Superpowers)<br>• `_engine-test-driven-development` (Superpowers)<br>• `_engine-code-review-and-quality` (Addy Osmani) |
| • "Fix this bug" / "Error on..."<br>• "Tests are failing"<br>• "این ارور رو برطرف کن"<br>• "چرا این تست فیل میشه؟"<br>• "خراب شده" | Bug report, stack trace, test failure, regression | **`sdlc-debug`**<br>(`/debug`) | • `_engine-triage-issue` (Matt Pocock)<br>• `_engine-systematic-debugging` (Superpowers)<br>• `_engine-test-driven-development` (Superpowers) |
| • "Ready to ship" / "Make PR"<br>• "Merge and finish"<br>• "کد رو تمیز کن و ببند"<br>• "نهایی‌سازی و آرشیو تغییرات" | All tasks in `tasks.md` completed (`- [x]`) | **`sdlc-ship`**<br>(`/ship`) | • `_engine-code-simplification` (Addy Osmani)<br>• `_engine-security-and-hardening` (Addy Osmani)<br>• `_engine-verification-before-completion` (Superpowers)<br>• `openspec archive` (OpenSpec) |

---

### 2. Framework Ownership & Boundary Rules

To prevent cognitive clutter, conflict, and workflow drift, strict separation of concerns is maintained across frameworks:

1. **OpenSpec owns Living Specifications & Task Artifacts**:
   - `openspec/changes/<change-name>/` is the **ONLY** location where specs, design docs, and atomic task breakdowns are created.
   - Delta specs live in `openspec/changes/<change-name>/specs/` using `ADDED / MODIFIED / REMOVED` requirements and `WHEN / THEN` acceptance criteria.
   - Once work is complete, `openspec archive` merges delta specs into the permanent Single Source of Truth at `openspec/specs/`.
2. **Matt Pocock (`skills`) owns Pre-Spec Architecture & Challenge**:
   - Relentless grilling of assumptions (`_engine-grill-me`).
   - Domain model alignment and glossary definitions (`_engine-ubiquitous-language`).
   - "Design It Twice": proposing at least 2 competing interface designs with clear seams and depth trade-offs before settling on an implementation (`_engine-design-an-interface`).
3. **Superpowers (`superpowers`) owns Execution & Subagent Discipline**:
   - Clean workspace isolation (`_engine-using-git-worktrees`).
   - Atomic subagent dispatch per task (`_engine-subagent-driven-development`).
   - Strict RED-GREEN-REFACTOR cycle (`_engine-test-driven-development`). Any production code written before a failing test MUST be deleted.
   - Non-negotiable terminal verification with concrete output evidence (`_engine-verification-before-completion`).
4. **Addy Osmani (`agent-skills`) owns Quality Guardrails & Anti-Rationalization**:
   - Strict Scope Discipline: Touch ONLY files specified in the active task. No unsolicited refactors.
   - Chesterton's Fence: Never delete or mutate existing logic/workarounds without proving why they were introduced.
   - Simplification & Security: Removing AI slop, simplifying nested code, hardening auth, CSRF, and data boundaries before shipping.

---

### 3. Master Anti-Rationalization Table (Forbidden Agent Excuses)

Under pressure or fatigue, agents often rationalize shortcuts. Every agent working in this repository must recognize and reject the following excuses:

| Forbidden Rationalization / Excuse | Reality & Mandatory Behavior |
| :--- | :--- |
| *"This change is simple, I don't need a spec."* | Simple tasks don't need *long* specs, but they still need acceptance criteria. A short spec surfaces hidden assumptions. |
| *"I'll write the spec after I code it."* | That's post-hoc documentation, not specification. The spec's value is in forcing clarity *before* code is written. |
| *"Too simple to test."* | Simple code breaks. Writing a test takes under 60 seconds. |
| *"I'll test after writing the implementation."* | Tests written after pass immediately and prove nothing. You never watched it fail, so you never proved it catches the bug. Test first (RED). |
| *"I already manually tested it."* | Manual testing is ad-hoc, untracked, and cannot be re-run on CI. Automated tests run the same way every time. |
| *"Deleting this un-tested code is wasteful."* | Sunk cost fallacy. Keeping code you cannot trust is the true waste. Delete untracked code and rewrite with TDD. |
| *"Existing code has no tests."* | You are improving the codebase. Add characterization tests for existing code before changing it. |
| *"It works, that's good enough."* | Working code that is unreadable, insecure, or architecturally flawed creates compounding debt. |
| *"The tests pass, so the code is good."* | Tests are necessary but not sufficient. They do not catch architectural degradation, OWASP security holes, or unmaintainable complexity. |
| *"We'll clean it up later."* | Later never comes. Review and clean before merge, not after. |
| *"AI-generated code is probably fine."* | AI code requires more scrutiny, not less. It is confident and plausible even when subtly wrong. |
| *"Chesterton's Fence: This check looks redundant, I'll remove it."* | Stop. Investigate `git log` and `git blame`. Prove why it was added before touching it. |
| *"Should work now / I'm confident."* | Confidence is not evidence. Run the verification command in the terminal and inspect the real output. |

---

## Part 2: PWS Monorepo Architecture & Reference

PWS is a Persian (RTL-first) grocery/deli e-commerce monorepo with three independent apps and no root build tooling:

- `api/` — Spring Boot 3.5 / Java 17 REST API (Maven wrapper), PostgreSQL 16 + Flyway. Package root `ir.pws.store`.
- `admin/` — staff back-office: Vite + React 19 + TypeScript + MUI, TanStack Query, react-hook-form + zod, i18next (fa/en).
- `shop/` — customer storefront: Next.js 15 App Router + Tailwind + Zustand.

Both frontends proxy `/api` to `http://localhost:8080` (admin also proxies `/media`), so the browser always talks same-origin and auth works via cookies.

---

### Commands Quick Reference

#### API (`cd api`)
```bash
./mvnw -q spring-boot:test-run      # run locally: embedded Postgres on :5433 (data in api/.devdb), dev seed, port 8080
./mvnw -q verify                    # all tests (each test class boots an embedded Zonky Postgres; no Docker needed)
./mvnw -q test -Dtest=ProductApiTest                 # single test class
./mvnw -q test -Dtest='ProductApiTest#someMethod'    # single test method
rm -rf .devdb                       # reset local dev data (API must be stopped)
```
- Dev login: `owner` / `ChangeMe12345`.
- SMS is `LoggingSmsSender` in dev; OTP codes are logged to the API console.

#### Admin (`cd admin`)
```bash
npm run dev            # http://localhost:5173
npm test               # vitest run
npx vitest run src/features/products/TierEditor.test.tsx   # single test file
npm run lint           # oxlint
npm run build          # tsc -b && vite build (type check + bundle)
```

#### Shop (`cd shop`)
```bash
npm run dev            # http://localhost:3000
npm test               # vitest run
npx vitest run src/components/CartDrawer.test.tsx
npm run build
```

#### E2E
`node run-browser-e2e.mjs` (repo root; Playwright from root `node_modules`) drives shop + admin against a running stack and writes screenshots to `docs/screenshots/e2e/`.

---

### Core Architectural Rules

1. **API Security & Matchers**:
   - `/api/admin/**` — Staff. Cookie JWT (`pws_admin_at`, refresh `pws_admin_rt`), CSRF enforced (`XSRF-TOKEN` cookie → `X-XSRF-TOKEN` header).
   - `/api/shop/**` — Customers. Cookie JWT (`pws_shop_at` / `pws_shop_rt`), OTP-only login, CSRF disabled.
   - Any endpoint not explicitly matched in `SecurityConfig.java` is `denyAll()`. New endpoints must be added to the matcher list or they return 403.
   - Role checks use `@PreAuthorize(Roles.X)` (`OWNER`, `PRODUCT_MANAGER`, `ORDER_OPERATOR`, `CUSTOMER`).

2. **Errors & Problem Details**:
   - Throw `ApiException(ErrorCode.X)` (or `ApiException.field(...)`).
   - Renders RFC 7807 problem JSON with bilingual messages `{fa, en}` from `messages_fa.properties` and `messages_en.properties`. Adding an `ErrorCode` requires adding both messages.

3. **Database & Migrations**:
   - `ddl-auto: validate`. Every schema change requires a new Flyway migration in `api/src/main/resources/db/migration/V<n>__name.sql`.

4. **Time & Audit**:
   - Inject `java.time.Clock` (from `ClockConfig`) rather than `Instant.now()`.
   - Staff mutations must record audit entries via `AuditService.record(...)`.

5. **Frontends & i18n**:
   - Admin UI strings must be added in both `admin/src/i18n/fa.json` and `en.json`. Default locale is `fa` (RTL).
   - Shop state is managed via Zustand (`authStore.ts`, `cartStore.ts`).
