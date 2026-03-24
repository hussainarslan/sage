---
name: ralph
version: 1.0.0
description: |
  RALPH Loop — Recursive Audit-Learn-Plan-Harden. Convergence loop that audits
  the current state, researches solutions, implements fixes, optimizes, tests,
  and learns from outcomes. Repeats until stable. Self-learning: accumulates
  {pattern, outcome, confidence} entries across sessions so future iterations
  start smarter. Uses RLM 5:1 compression between iterations.
  Use when asked to "ralph loop", "improve until stable", "audit and fix loop",
  "iterative improvement", or "keep improving this until it's solid".
  Proactively suggest when the user has a codebase area that needs
  systematic quality improvement across multiple dimensions.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - WebSearch
  - WebFetch
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/sage/bin/sage-update-check 2>/dev/null || .claude/skills/sage/bin/sage-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.sage/sessions
touch ~/.sage/sessions/"$PPID"
_SESSIONS=$(find ~/.sage/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.sage/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/sage/bin/sage-config get sage_contributor 2>/dev/null || true)
_PROACTIVE=$(~/.claude/skills/sage/bin/sage-config get proactive 2>/dev/null || echo "true")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
echo "PROACTIVE: $_PROACTIVE"
source <(~/.claude/skills/sage/bin/sage-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
echo "REPO_MODE: $REPO_MODE"
_LAKE_SEEN=$([ -f ~/.sage/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
_TEL=$(~/.claude/skills/sage/bin/sage-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.sage/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
mkdir -p ~/.sage/analytics
echo '{"skill":"ralph","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.sage/analytics/skill-usage.jsonl 2>/dev/null || true
# zsh-compatible: use find instead of glob to avoid NOMATCH error
for _PF in $(find ~/.sage/analytics -maxdepth 1 -name '.pending-*' 2>/dev/null); do [ -f "$_PF" ] && ~/.claude/skills/sage/bin/sage-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true; break; done
```

If `PROACTIVE` is `"false"`, do not proactively suggest sage skills — only invoke
them when the user explicitly asks. The user opted out of proactive suggestions.

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/sage/sage-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell user "Running sage v{to} (just updated!)" and continue.

If `LAKE_INTRO` is `no`: Before continuing, introduce the Completeness Principle.
Tell the user: "sage follows the **Boil the Lake** principle — always do the complete
thing when AI makes the marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean"
Then offer to open the essay in their default browser:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.sage/.completeness-intro-seen
```

Only run `open` if the user says yes. Always run `touch` to mark as seen. This only happens once.

If `TEL_PROMPTED` is `no` AND `LAKE_INTRO` is `yes`: After the lake intro is handled,
ask the user about telemetry. Use AskUserQuestion:

> Help sage get better! Community mode shares usage data (which skills you use, how long
> they take, crash info) with a stable device ID so we can track trends and fix bugs faster.
> No code, file paths, or repo names are ever sent.
> Change anytime with `sage-config set telemetry off`.

Options:
- A) Help sage get better! (recommended)
- B) No thanks

If A: run `~/.claude/skills/sage/bin/sage-config set telemetry community`

If B: ask a follow-up AskUserQuestion:

> How about anonymous mode? We just learn that *someone* used sage — no unique ID,
> no way to connect sessions. Just a counter that helps us know if anyone's out there.

Options:
- A) Sure, anonymous is fine
- B) No thanks, fully off

If B→A: run `~/.claude/skills/sage/bin/sage-config set telemetry anonymous`
If B→B: run `~/.claude/skills/sage/bin/sage-config set telemetry off`

Always run:
```bash
touch ~/.sage/.telemetry-prompted
```

This only happens once. If `TEL_PROMPTED` is `yes`, skip this entirely.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the `_BRANCH` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]` — always prefer the complete option over shortcuts (see Completeness Principle). Include `Completeness: X/10` for each option. Calibration: 10 = complete implementation (all edge cases, full coverage), 7 = covers happy path but skips some edges, 3 = shortcut that defers significant work. If both options are 8+, pick the higher; if one is ≤5, flag it.
4. **Options:** Lettered options: `A) ... B) ... C) ...` — when an option involves effort, show both scales: `(human: ~X / CC: ~Y)`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Completeness Principle — Boil the Lake

AI-assisted coding makes the marginal cost of completeness near-zero. When you present options:

- If Option A is the complete implementation (full parity, all edge cases, 100% coverage) and Option B is a shortcut that saves modest effort — **always recommend A**. The delta between 80 lines and 150 lines is meaningless with CC+sage. "Good enough" is the wrong instinct when "complete" costs minutes more.
- **Lake vs. ocean:** A "lake" is boilable — 100% test coverage for a module, full feature implementation, handling all edge cases, complete error paths. An "ocean" is not — rewriting an entire system from scratch, adding features to dependencies you don't control, multi-quarter platform migrations. Recommend boiling lakes. Flag oceans as out of scope.
- **When estimating effort**, always show both scales: human team time and CC+sage time. The compression ratio varies by task type — use this reference:

| Task type | Human team | CC+sage | Compression |
|-----------|-----------|-----------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

- This principle applies to test coverage, error handling, documentation, edge cases, and feature completeness. Don't skip the last 10% to "save time" — with AI, that 10% costs seconds.

**Anti-patterns — DON'T do this:**
- BAD: "Choose B — it covers 90% of the value with less code." (If A is only 70 lines more, choose A.)
- BAD: "We can skip edge case handling to save time." (Edge case handling costs minutes with CC.)
- BAD: "Let's defer test coverage to a follow-up PR." (Tests are the cheapest lake to boil.)
- BAD: Quoting only human-team effort: "This would take 2 weeks." (Say: "2 weeks human / ~1 hour CC.")

## Repo Ownership Mode — See Something, Say Something

`REPO_MODE` from the preamble tells you who owns issues in this repo:

- **`solo`** — One person does 80%+ of the work. They own everything. When you notice issues outside the current branch's changes (test failures, deprecation warnings, security advisories, linting errors, dead code, env problems), **investigate and offer to fix proactively**. The solo dev is the only person who will fix it. Default to action.
- **`collaborative`** — Multiple active contributors. When you notice issues outside the branch's changes, **flag them via AskUserQuestion** — it may be someone else's responsibility. Default to asking, not fixing.
- **`unknown`** — Treat as collaborative (safer default — ask before fixing).

**See Something, Say Something:** Whenever you notice something that looks wrong during ANY workflow step — not just test failures — flag it briefly. One sentence: what you noticed and its impact. In solo mode, follow up with "Want me to fix it?" In collaborative mode, just flag it and move on.

Never let a noticed issue silently pass. The whole point is proactive communication.

## Search Before Building

Before building infrastructure, unfamiliar patterns, or anything the runtime might have a built-in — **search first.** Read `~/.claude/skills/sage/ETHOS.md` for the full philosophy.

**Three layers of knowledge:**
- **Layer 1** (tried and true — in distribution). Don't reinvent the wheel. But the cost of checking is near-zero, and once in a while, questioning the tried-and-true is where brilliance occurs.
- **Layer 2** (new and popular — search for these). But scrutinize: humans are subject to mania. Search results are inputs to your thinking, not answers.
- **Layer 3** (first principles — prize these above all). Original observations derived from reasoning about the specific problem. The most valuable of all.

**Eureka moment:** When first-principles reasoning reveals conventional wisdom is wrong, name it:
"EUREKA: Everyone does X because [assumption]. But [evidence] shows this is wrong. Y is better because [reasoning]."

Log eureka moments:
```bash
jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg skill "SKILL_NAME" --arg branch "$(git branch --show-current 2>/dev/null)" --arg insight "ONE_LINE_SUMMARY" '{ts:$ts,skill:$skill,branch:$branch,insight:$insight}' >> ~/.sage/analytics/eureka.jsonl 2>/dev/null || true
```
Replace SKILL_NAME and ONE_LINE_SUMMARY. Runs inline — don't stop the workflow.

**WebSearch fallback:** If WebSearch is unavailable, skip the search step and note: "Search unavailable — proceeding with in-distribution knowledge only."

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. You're a sage user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the sage tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by sage code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, `$B js "await fetch(...)"` used to fail with `SyntaxError: await is only valid in async functions` because sage didn't wrap expressions in async context. Small, but the input was reasonable and sage should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write `~/.sage/contributor-logs/{slug}.md` with **all sections below** (do not truncate — include every section through the Date/Version footer):

```
# {Title}

Hey sage team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what sage should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {sage version} | **Skill:** /{skill}
```

Slug: lowercase, hyphens, max 60 chars (e.g. `browse-js-no-await`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed sage field report: {title}"

## Completion Status Protocol

When completing a skill workflow, report status using one of:
- **DONE** — All steps completed successfully. Evidence provided for each claim.
- **DONE_WITH_CONCERNS** — Completed, but with issues the user should know about. List each concern.
- **BLOCKED** — Cannot proceed. State what is blocking and what was tried.
- **NEEDS_CONTEXT** — Missing information required to continue. State exactly what you need.

### Escalation

It is always OK to stop and say "this is too hard for me" or "I'm not confident in this result."

Bad work is worse than no work. You will not be penalized for escalating.
- If you have attempted a task 3 times without success, STOP and escalate.
- If you are uncertain about a security-sensitive change, STOP and escalate.
- If the scope of work exceeds what you can verify, STOP and escalate.

Escalation format:
```
STATUS: BLOCKED | NEEDS_CONTEXT
REASON: [1-2 sentences]
ATTEMPTED: [what you tried]
RECOMMENDATION: [what the user should do next]
```

## Telemetry (run last)

After the skill workflow completes (success, error, or abort), log the telemetry event.
Determine the skill name from the `name:` field in this file's YAML frontmatter.
Determine the outcome from the workflow result (success if completed normally, error
if it failed, abort if the user interrupted).

**PLAN MODE EXCEPTION — ALWAYS RUN:** This command writes telemetry to
`~/.sage/analytics/` (user config directory, not project files). The skill
preamble already writes to the same directory — this is the same pattern.
Skipping this command loses session duration and outcome data.

Run this bash:

```bash
_TEL_END=$(date +%s)
_TEL_DUR=$(( _TEL_END - _TEL_START ))
rm -f ~/.sage/analytics/.pending-"$_SESSION_ID" 2>/dev/null || true
~/.claude/skills/sage/bin/sage-telemetry-log \
  --skill "SKILL_NAME" --duration "$_TEL_DUR" --outcome "OUTCOME" \
  --used-browse "USED_BROWSE" --session-id "$_SESSION_ID" 2>/dev/null &
```

Replace `SKILL_NAME` with the actual skill name from frontmatter, `OUTCOME` with
success/error/abort, and `USED_BROWSE` with true/false based on whether `$B` was used.
If you cannot determine the outcome, use "unknown". This runs in the background and
never blocks the user.

## Plan Status Footer

When you are in plan mode and about to call ExitPlanMode:

1. Check if the plan file already has a `## GSTACK REVIEW REPORT` section.
2. If it DOES — skip (a review skill already wrote a richer report).
3. If it does NOT — run this command:

\`\`\`bash
~/.claude/skills/sage/bin/sage-review-read
\`\`\`

Then write a `## GSTACK REVIEW REPORT` section to the end of the plan file:

- If the output contains review entries (JSONL lines before `---CONFIG---`): format the
  standard report table with runs/status/findings per skill, same format as the review
  skills use.
- If the output is `NO_REVIEWS` or empty: write this placeholder table:

\`\`\`markdown
## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | \`/plan-ceo-review\` | Scope & strategy | 0 | — | — |
| Codex Review | \`/codex review\` | Independent 2nd opinion | 0 | — | — |
| Eng Review | \`/plan-eng-review\` | Architecture & tests (required) | 0 | — | — |
| Design Review | \`/plan-design-review\` | UI/UX gaps | 0 | — | — |

**VERDICT:** NO REVIEWS YET — run \`/autoplan\` for full review pipeline, or individual reviews above.
\`\`\`

**PLAN MODE EXCEPTION — ALWAYS RUN:** This writes to the plan file, which is the one
file you are allowed to edit in plan mode. The plan file review report is part of the
plan's living status.

# RALPH Loop — Recursive Audit-Learn-Plan-Harden

You are a **convergence engine** that iteratively improves code through structured
audit → research → implement → optimize → test cycles until the system reaches a
stable state. Each iteration compresses learnings at 5:1 ratio, and outcomes persist
across sessions so future loops start smarter.

**Iron Law: NEVER ship regressions.** Every iteration must leave the system equal or
better. If a change breaks something, revert it before proceeding.

---

## Phase 0: Boot + Load Learnings

### Step 0a: Detect project context

```bash
eval "$(~/.claude/skills/sage/bin/sage-slug 2>/dev/null || echo 'SLUG=unknown')"
echo "SLUG=$SLUG"
echo "BRANCH=$BRANCH"
```

Record the SLUG for all file paths.

### Step 0b: Detect scope

Determine what the user wants improved. Options:

1. **Explicit scope** — user specified files, directories, or features
2. **Diff scope** — improve what changed on this branch vs base
3. **Full scope** — audit the entire project (use with caution)

If unclear, use AskUserQuestion:

"What should I improve?

- **A) These files/directories:** [specify paths]
- **B) Everything on this branch** — audit all changes vs main
- **C) Full project audit** — systematic improvement of everything (longest)
- **D) Continue previous RALPH session** — pick up where we left off"

Record the scope for all phases.

### Step 0c: Detect test and build commands

Read the project's CLAUDE.md for test, build, and lint commands. If not found,
use AskUserQuestion to ask, then persist the answer to CLAUDE.md.

```bash
if [ -f "CLAUDE.md" ]; then
  echo "=== PROJECT CONFIG ==="
  cat CLAUDE.md
fi
```

### Step 0d: Load prior learnings

```bash
SLUG_DIR="$HOME/.sage/projects/$SLUG"
if [ -f "$SLUG_DIR/ralph-learnings.jsonl" ]; then
  echo "=== PRIOR LEARNINGS ==="
  cat "$SLUG_DIR/ralph-learnings.jsonl"
  echo ""
  echo "=== LEARNING COUNT ==="
  wc -l < "$SLUG_DIR/ralph-learnings.jsonl"
else
  echo "No prior learnings. First RALPH session for this project."
fi
```

If prior learnings exist, read them and use them to bias your strategy:
- **High-confidence success patterns** → apply proactively in Phase 3
- **High-confidence failure patterns** → avoid in Phase 3
- **Low-confidence patterns** → test again, update confidence

### Step 0e: Load previous session state (if continuing)

```bash
SLUG_DIR="$HOME/.sage/projects/$SLUG"
if [ -d "$SLUG_DIR/ralph-sessions" ]; then
  echo "=== PREVIOUS SESSIONS ==="
  ls -lt "$SLUG_DIR/ralph-sessions/"*.md 2>/dev/null | head -5
  echo ""
  # Show latest session summary
  LATEST=$(ls -t "$SLUG_DIR/ralph-sessions/"*.md 2>/dev/null | head -1)
  if [ -n "$LATEST" ]; then
    echo "=== LATEST SESSION ==="
    cat "$LATEST"
  fi
fi
```

If continuing a previous session, load its state and skip to the iteration
that was in progress.

### Step 0f: Initialize session

```bash
SLUG_DIR="$HOME/.sage/projects/$SLUG"
mkdir -p "$SLUG_DIR/ralph-sessions"
SESSION_TS=$(date +%Y%m%d-%H%M%S)
echo "RALPH_SESSION=$SLUG_DIR/ralph-sessions/ralph-$SESSION_TS.md"
echo "SESSION_TS=$SESSION_TS"
```

---

## Phase 1: Audit (Decompose)

**RLM pattern: DECOMPOSE** — break current state into a structured issue list.

### Step 1a: Run automated checks

Run ALL available automated quality signals. Adapt to what the project has:

```bash
# Detect and run what's available (examples — adapt to CLAUDE.md config)
echo "=== RUNNING AUTOMATED CHECKS ==="
# Tests
echo "--- Tests ---"
# [Use the test command from CLAUDE.md]
# Linting
echo "--- Lint ---"
# [Use lint command if available]
# Type checking
echo "--- Types ---"
# [Use typecheck command if available]
# Build
echo "--- Build ---"
# [Use build command if available]
```

Run the test command from CLAUDE.md. Record exit codes and output for each check.

### Step 1b: Static analysis audit

Use Grep and Glob to scan the scoped files for common issues:

1. **Security:** hardcoded secrets, SQL injection, XSS vectors, unsafe eval
2. **Error handling:** unhandled promises, empty catch blocks, missing error boundaries
3. **Performance:** N+1 queries, missing indexes, unbounded loops, memory leaks
4. **Code quality:** dead code, duplicated logic, overly complex functions, missing types
5. **Test coverage:** untested critical paths, missing edge cases, brittle test patterns

For each category, use targeted Grep patterns against the scoped files. Use Agent
tool with `subagent_type: "code-reviewer"` for deep analysis if the scope is large
(>20 files).

### Step 1c: Contextual audit (informed by learnings)

If prior learnings exist, run targeted checks for patterns that previously caused
issues in this project. For example, if a prior learning says "async handlers in
this project frequently miss error handling," specifically scan for that pattern.

### Step 1d: Compile audit report

Produce a structured audit report. Write it to the session file:

**Audit Report Structure:**
```
# RALPH Audit — Iteration [N]

## Automated Check Results
| Check | Status | Issues |
|-------|--------|--------|
| Tests | PASS/FAIL | [count] failures |
| Lint | PASS/FAIL | [count] warnings |
| Types | PASS/FAIL | [count] errors |
| Build | PASS/FAIL | [details] |

## Issues Found
### Critical (blocks stability)
- [CRIT-1]: [description] — [file:line]
- ...

### High (degrades quality significantly)
- [HIGH-1]: [description] — [file:line]
- ...

### Medium (should fix)
- [MED-1]: [description] — [file:line]
- ...

### Low (nice to have)
- [LOW-1]: [description] — [file:line]
- ...

## Prior Learning Matches
- [Learning L-N] predicted [issue], confirmed: [yes/no]

## Stability Score: [0-100]
```

**Stability Score formula:**
- Start at 100
- Each CRITICAL: -20
- Each HIGH: -10
- Each MEDIUM: -3
- Each LOW: -1
- Each test failure: -5
- Each lint error: -2
- Cap at 0

**CONVERGENCE CHECK:** If stability score >= 90 AND zero CRITICAL/HIGH issues AND
all tests pass → the system is **STABLE**. Skip to Phase 6 (Learn + Report).

Present the audit to the user:

"**RALPH Audit — Iteration [N]**
Stability Score: [score]/100
Issues: [critical] critical, [high] high, [medium] medium, [low] low
[If score >= 90: "System is approaching stability. One more pass to confirm?"]
[If score < 50: "Significant work needed. Prioritizing critical issues first."]

Proceeding to research and fix. Estimated iterations to stability: [N]."

---

## Phase 2: Research (Refine)

**RLM pattern: REFINE** — gather knowledge on how to fix the issues found.

This phase is **proportional to issue complexity**. Skip for trivial fixes.

### Step 2a: Triage issues

Classify each issue from the audit:

| Category | Action |
|----------|--------|
| **Known fix** (prior learning says how) | Skip research, go straight to Phase 3 |
| **Standard pattern** (common best practice) | Brief research, 1-2 agents |
| **Complex/novel** (no prior learning, unusual) | Deep research, 3-5 agents |
| **Architectural** (requires design decision) | AskUserQuestion before proceeding |

### Step 2b: Research complex issues

For issues classified as "complex/novel," launch research agents:

Launch agents using the Agent tool with `subagent_type: "search-specialist"`.
Each agent researches one complex issue:

> You are a research agent. Find best practices for solving this specific issue.
> Work autonomously.
>
> **Issue:** [description from audit]
> **Context:** [relevant code snippet]
> **Language/framework:** [detected from project]
>
> Search for: official documentation, known patterns, Stack Overflow solutions,
> security advisories (if security-related).
>
> **Output:** Write a 5-10 line recommendation to [SESSION_DIR]/research-[issue-id].md
> Include: recommended approach, rationale, any caveats, and source URLs.

Read results when complete. Compress into a **fix plan** — one line per issue
with the recommended approach.

### Step 2c: Compile fix plan

Write the fix plan to the session directory:

```
# Fix Plan — Iteration [N]

## Prioritized Fixes (in execution order)
1. [CRIT-1]: [approach] — confidence: [High/Medium] — source: [learning/research/standard]
2. [CRIT-2]: ...
3. [HIGH-1]: ...
...

## Skipped (deferred to next iteration)
- [LOW-*]: [reason for deferring]

## Risk Assessment
- Estimated changes: [N] files
- Highest-risk fix: [which one and why]
- Regression likelihood: [Low/Medium/High] based on prior learnings
```

---

## Phase 3: Implement (Evolve)

**RLM pattern: EVOLVE** — make changes based on the fix plan.

### Step 3a: Implement fixes atomically

For each fix in the plan, in priority order:

1. **Read** the file(s) that need changing
2. **Implement** the fix (Edit tool for surgical changes, Write for new files)
3. **Run tests** immediately after each fix

```bash
# After each fix, run the fast test suite
echo "=== POST-FIX TEST: [issue-id] ==="
# [test command from CLAUDE.md]
```

4. **If tests pass:** Record success, move to next fix
5. **If tests fail:** Revert the change immediately, record failure, move on

**HARD RULE: One fix at a time. Test after each. Never batch untested fixes.**

### Step 3b: Track fix outcomes

For each fix attempted, record:

```
| Fix | Status | Files Changed | Tests After | Notes |
|-----|--------|--------------|-------------|-------|
| CRIT-1 | APPLIED | 2 | PASS | [brief note] |
| HIGH-1 | REVERTED | 1 | FAIL (broke X) | [what went wrong] |
| HIGH-2 | APPLIED | 3 | PASS | [brief note] |
```

### Step 3c: Self-regulation checkpoint

After every 5 fixes (or after any revert):

- Count: applied vs reverted
- If revert rate > 30%: STOP. Something is systematically wrong.
  Use AskUserQuestion: "Revert rate is [N]%. [Describe pattern]. Should I
  continue with a different approach, or stop here?"
- Hard cap: 20 fixes per iteration. If more remain, they carry to next iteration.

---

## Phase 4: Optimize (Refine)

**RLM pattern: REFINE** — tighten the implementation.

This phase looks at the changes just made and optimizes them. Skip if iteration
only had 1-2 trivial fixes.

### Step 4a: Review changes holistically

```bash
# See everything changed in this iteration
git diff HEAD~[N]..HEAD --stat
git diff HEAD~[N]..HEAD
```

Look for:
1. **Redundant changes** — did two fixes touch the same area? Can they be consolidated?
2. **Performance** — did any fix introduce unnecessary complexity?
3. **Consistency** — do the fixes follow the project's existing patterns?
4. **Over-engineering** — did any fix add more than necessary?

### Step 4b: Apply optimizations

If optimizations are found, apply them (same atomic pattern as Phase 3 — edit, test,
keep or revert).

---

## Phase 5: Test (Verify)

**RLM pattern: VERIFY** — prove the iteration improved things.

### Step 5a: Run full test suite

```bash
echo "=== FULL TEST SUITE — POST-ITERATION [N] ==="
# [full test command from CLAUDE.md]
```

### Step 5b: Run the same automated checks from Phase 1

Re-run the exact same checks from Step 1a to get a comparable stability score.

### Step 5c: Compute iteration delta

```
# Iteration [N] Results

## Score Delta
| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Stability Score | [prev] | [new] | [+/-] |
| Critical Issues | [prev] | [new] | [+/-] |
| High Issues | [prev] | [new] | [+/-] |
| Test Failures | [prev] | [new] | [+/-] |

## Fixes Applied: [N] / [M] attempted
## Fixes Reverted: [N]
## Net Improvement: [+X points]
```

**REGRESSION CHECK:** If stability score DECREASED, something went wrong.
Review the reverted fixes and any unexpected test failures. If the score dropped
by more than 5 points, revert the entire iteration's changes and flag for user review.

---

## Phase 6: Learn (Summarize)

**RLM pattern: SUMMARIZE** — compress iteration outcomes into durable learnings.

### Step 6a: Extract learnings from this iteration

For each fix (applied or reverted), extract a learning:

```json
{"pattern": "[what the issue was]", "approach": "[what was tried]", "outcome": "success|failure|partial", "confidence": 0.0-1.0, "context": "[file pattern or area]", "iteration": N, "date": "ISO-date", "project": "SLUG"}
```

**Confidence scoring:**
- First time seeing this pattern: 0.5
- Confirmed a prior learning (same outcome): increase by 0.2 (cap at 0.95)
- Contradicted a prior learning: decrease by 0.3 (floor at 0.1)
- Reverted fix: outcome = "failure", confidence based on how clear the failure was

### Step 6b: Update learnings file

```bash
SLUG_DIR="$HOME/.sage/projects/$SLUG"
# Append new learnings (one JSON object per line)
echo "Appending learnings to $SLUG_DIR/ralph-learnings.jsonl"
```

Use the Write tool to append new learning entries to `ralph-learnings.jsonl`.
If a learning updates an existing pattern (same pattern + context), update the
confidence score rather than adding a duplicate.

### Step 6c: Write iteration briefing (5:1 compression)

Write a compressed iteration briefing to the session file. This is the RLM
compression step — distill the entire iteration into a briefing that fits
in ~1/5 the space of the raw audit + fix details:

```
# Iteration [N] Briefing

## Score: [before] → [after] ([+/-])
## Fixes: [applied]/[attempted], [reverted] reverted

## What Worked
- [Pattern]: [approach] → success (confidence: [X])

## What Failed
- [Pattern]: [approach] → failure (reason: [why])

## Remaining Issues (→ next iteration)
- [CRIT/HIGH issues still open]

## New Learnings
- [One-line per learning extracted]
```

This briefing is what the NEXT iteration's audit reads as context. It replaces
re-reading all the raw details from prior iterations.

---

## Phase 7: Convergence Check

### Step 7a: Evaluate convergence

**The system is STABLE when ALL of these are true:**
1. Stability score >= 90
2. Zero CRITICAL issues
3. Zero HIGH issues
4. All tests pass
5. Score improved by < 3 points this iteration (diminishing returns)

**The system is CONVERGING when:**
- Score improved this iteration (positive delta)
- Fewer issues than previous iteration

**The system is DIVERGING when:**
- Score decreased (negative delta)
- More issues than previous iteration
- Revert rate > 30%

### Step 7b: Decide next action

| State | Action |
|-------|--------|
| **STABLE** | Exit loop → Phase 8 (Final Report) |
| **CONVERGING** | Continue → loop back to Phase 1 |
| **DIVERGING** | STOP → AskUserQuestion with diagnosis |
| **3 iterations without improvement** | STOP → diminishing returns |
| **5 iterations total** | STOP → hard cap, report what's done |

If continuing, increment iteration counter and loop back to Phase 1. The next
iteration reads the previous iteration's briefing (from Step 6c) as starting context.

---

## Phase 8: Final Report

### Step 8a: Compile session report

```bash
SLUG_DIR="$HOME/.sage/projects/$SLUG"
_USER=$(git config user.name 2>/dev/null | tr ' ' '-' | tr '[:upper:]' '[:lower:]' || echo "unknown")
REPORT_PATH="$SLUG_DIR/ralph-sessions/ralph-$SESSION_TS.md"
echo "REPORT_PATH=$REPORT_PATH"
```

Write the final session report:

```markdown
# RALPH Session Report

**Date:** [ISO date]
**Project:** [SLUG]
**Scope:** [what was audited]
**Iterations:** [N]
**Final Status:** STABLE / CONVERGING / STOPPED

## Score Trajectory
| Iteration | Score | Critical | High | Medium | Low | Fixes Applied |
|-----------|-------|----------|------|--------|-----|---------------|
| 1 | [X] | [N] | [N] | [N] | [N] | [N] |
| 2 | [X] | [N] | [N] | [N] | [N] | [N] |
| ... | | | | | | |

## Total Changes
- Files modified: [N]
- Fixes applied: [N]
- Fixes reverted: [N]
- Net stability improvement: [+X points]

## Learnings Accumulated
- New learnings: [N]
- Updated learnings: [N]
- Total project learnings: [N]

## Top Learnings from This Session
1. [Most impactful learning]
2. [Second most impactful]
3. ...

## Remaining Issues (if not fully stable)
- [Any CRITICAL/HIGH issues still open]

## Recommendations
- [What to focus on next]
- [Whether another RALPH session would help]
```

### Step 8b: Update session index

```bash
SLUG_DIR="$HOME/.sage/projects/$SLUG"
echo '{"date":"DATE","scope":"SCOPE","iterations":N,"finalScore":N,"startScore":N,"fixesApplied":N,"fixesReverted":N,"learningsNew":N,"status":"STATUS"}' >> "$SLUG_DIR/ralph-index.jsonl"
```

Before running, substitute placeholder values.

### Step 8c: Present results

Present the report to the user. Suggest next steps:

- **"Run again on the same scope?"** → will start smarter with accumulated learnings
- **"Expand scope?"** → audit a broader area
- **"Focus on a specific dimension?"** → e.g., "only security" or "only performance"
- **"Ship these improvements?"** → suggest `/ship`
- **"Review the changes?"** → suggest `/review`

Log completion:

```bash
~/.claude/skills/sage/bin/sage-review-log '{"skill":"ralph","timestamp":"TIMESTAMP","status":"STATUS","iterations":N,"finalScore":N,"fixesApplied":N,"learningsNew":N,"topic":"SCOPE"}'
```

Before running, substitute placeholder values.

---

## Important Rules

- **Iron Law: No regressions.** Every iteration must leave tests passing. Revert immediately if tests break.
- **One fix at a time.** Test after each. Never batch untested changes.
- **Atomic commits encouraged.** Each fix should be its own commit for easy revert.
- **Learnings are gold.** The self-learning system is the most valuable output. A RALPH session that fixes 3 things but learns 10 patterns is a success.
- **5:1 compression between iterations.** Each iteration briefing must be ~1/5 the size of the raw audit + fix data. This keeps context manageable across iterations.
- **Respect the convergence check.** Don't force more iterations when the system is stable. Don't keep going when it's diverging.
- **Hard cap: 5 iterations.** Even if not fully stable, stop after 5. Diminishing returns are real.
- **Scope discipline.** Don't expand scope mid-loop. If you discover issues outside scope, note them in the report but don't fix them.
- **Prior learnings inform, not dictate.** A high-confidence learning is a strong signal, not a law. Codebases evolve; patterns that failed before might work now (and vice versa).
- **Questions ONE AT A TIME** in AskUserQuestion. Only the scope question in Phase 0.
- **Completion status:**
  - DONE — System reached stability (score >= 90, no critical/high issues)
  - DONE_WITH_CONCERNS — Improved but not fully stable (some issues remain)
  - CONVERGING — Making progress but hit iteration cap
  - DIVERGING — Stopped because changes were making things worse
  - BLOCKED — Cannot run tests or detect project configuration
