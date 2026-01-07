# /onboard

Load project context and prepare for a development session.

## Arguments

- `--auto` - Autopilot mode: auto-select top Ready issue, skip user prompts

## Instructions

### 0. Git Sync (Sub-Agent)

**First, ensure branch is current with main.** Use a sub-agent to keep git operations out of main context:

**Sub-agent prompt:**
```
Sync this worktree's branch with origin/main before starting work.

STEPS:
1. Get current state:
   - `git fetch origin`
   - `git branch --show-current`
   - `git status --porcelain` (check for uncommitted changes)

2. Check if sync needed:
   - `git rev-list --count HEAD..origin/main` (commits behind)

3. If behind origin/main AND working tree is clean:
   - `git rebase origin/main`
   - Report commits synced

4. If behind but have uncommitted changes:
   - Report: "Branch is X commits behind main but has uncommitted changes"
   - Suggest: run `/sync` to stash and rebase, or commit first

5. If already up to date:
   - Report: "Already synced with main"

RETURN FORMAT:
## Git Status
- Branch: {name}
- Status: SYNCED | BEHIND ({N} commits) | DIRTY
- [If synced:] Rebased {N} commits from main
- [If behind+dirty:] Has uncommitted changes, run /sync to update
```

Present git status briefly to user, then continue.

### 0.5. Install Dependencies (Sub-Agent)

**Ensure dependencies are current.** Use a sub-agent:

**Sub-agent prompt:**
```
Install/update dependencies

STEPS:
1. If needed run the appropriate installs for this language

2. Check for issues:
   - Any peer dependency warnings?
   - Any vulnerabilities reported?

RETURN FORMAT:
## Dependencies
- Status: UP TO DATE | INSTALLED | ERRORS
- [If warnings:] Peer dependency warnings: {brief summary}
- [If vulnerabilities:] Security: {X} vulnerabilities run any fixes
```

If there are errors, report to user before continuing.

### 1. Read Core Context

Read `CLAUDE.md`. `AGENTS.md`, `AGENTS-REFERENCE.md` for:
- Development commands and conventions
- Rules and pitfalls to avoid
- Quick reference for key paths


### 2. Fetch Current Work (via Sub-Agent)

Use the **Task tool** with `subagent_type="general-purpose"` to explore Linear thoroughly. This keeps all ticket-browsing out of main context while giving us smart recommendations.

**Sub-agent prompt:**
```
Explore Beads to understand current work state for this project. Your job is to read thoroughly and return a curated summary.

STEPS:
1. Run `bd ready` to get ready tasks
2. Get ALL issues in "In Progress" status - read full details for each
3. Get ALL issues in "Ready" status - read full details for each
4. Get issues in "Backlog" status - read full details for top candidates
5. Analyze relationships, dependencies, and logical sequencing

RETURN FORMAT:

## Current Work
[If any issue is "In Progress", include:]
- Issue: [ID] - [Title]
- Status: In Progress
- Full Spec: [Complete issue description - this IS the spec]
- Checklist Progress: [X/Y complete]
- Remaining Items:
  - [ ] item 1
  - [ ] item 2

[If nothing in progress, say "None - ready to pick up new work"]

## Recommended Next
[2-3 issues you recommend, with reasoning:]

1. **[ID] - [Title]**
   Summary: [1-2 sentences on what it involves]
   Why now: [Why this is a good next choice - dependencies, builds on recent work, unblocks others, appropriate scope, etc.]

2. **[ID] - [Title]**
   Summary: [1-2 sentences]
   Why now: [Reasoning]

## Other Ready Work
[Brief list of other available issues:]
- [ID] - [Title] (brief note if relevant)

## Notes
[Any observations about project state, blockers, or suggestions]
```

### 3. Present to User (Interactive Mode)

**Skip this section if `--auto` flag is set.**

Take the sub-agent's output and present it conversationally:

```
**Git:** Synced with main (or "X commits behind - run /sync")
**Deps:** Up to date (or "Installed X packages")
**Current Project:** {project Name}
**Current Issue:** [ID] - [Title] (or "None")

[If there's current work:]
Spec Summary: [1-2 sentence overview]
Progress: [X/Y] checklist items
Remaining:
- [ ] Task 1
- [ ] Task 2

[Always include recommendations:]
**Suggested next:**
1. [ID] - [Title] — [brief why]
2. [ID] - [Title] — [brief why]

What would you like to work on?
```

### 3a. Auto-Select (Autopilot Mode)

**Only run this section if `--auto` flag is set.**

From the sub-agent's output, select work automatically:

1. **If issue is In Progress:** Continue with that issue
2. **If no In Progress but Ready queue has items:** Pick first Ready issue (by priority, then age)
3. **If Ready queue is empty:** Output `<promise>QUEUE_EMPTY</promise>` and stop

Selection criteria for Ready issues:
- Status = "Ready" (not Backlog, not Triage)
- Sort by: priority (urgent first), then created date (oldest first)
- Pick first match

If selected, briefly log: `Autopilot: Selected [ID] - [Title]`

### 4. Load Issue Context

**Interactive mode:** Once the user picks a task
**Autopilot mode:** Once auto-selection is made

- If it was the "In Progress" issue, you already have the full spec from the sub-agent
- If it's a different issue, call beads to load the full spec (one call is fine)
- Update issue status to "In Progress" if not already

### 5. Load Technical Context (if needed)

Based on the chosen issue, optionally read:
- `PLANS.md`
- Specific source files mentioned in the spec

Only load these if needed for the current task - don't over-read.

## Notes

- This is read-only context loading - don't make any changes
- Beads is the source of truth for work status
- If Beads is unavailable, fall back to asking user what they want to work on
- The sub-agent reads many tickets but only returns what matters
- Main context stays clean: CLAUDE.md/AGENTS.md/AGENTS-REFERENCE.md + curated summary + chosen issue spec

## During Work: Proactive Issue Discovery

While implementing, proactively identify and capture related work:

- **Bugs discovered** → `/capture` as bug
- **Refactoring opportunities** → `/capture` as chore
- **Missing features needed** → `/capture` as feature
- **Tech debt encountered** → `/capture` as chore

These go to Triage status. Don't block current work - just capture and continue.

## Related Commands

- `/sync` - Manually sync branch with main (stashes, rebases, pops)
- `/finish` - End session: verify, review, create PR, reset branch
- `/verify` - Verify implementation matches spec
- `/review` - Run comprehensive code review