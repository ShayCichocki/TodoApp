# /review

Comprehensive code review across multiple dimensions using specialized skills.

## Instructions

### 1. Get the Diff

First, get the changes to review:

```bash
# Get diff from main
git diff origin/main...HEAD

# Also get list of changed files
git diff --name-only origin/main...HEAD
```

### 2. Launch Review Skills in Parallel

Use **4 sub-agents in parallel**, one for each review dimension. Each sub-agent should invoke the corresponding skill.

Launch all simultaneously:

**Sub-agent 1: Security Review**
```
You are reviewing code for security issues.

Read the skill file at `.claude/skills/review-security/SKILL.md` for detailed guidance.

DIFF TO REVIEW:
{paste the diff}

CHANGED FILES:
{list of files}

Apply the security checklist from the skill. Return findings in this format:

## Security Review

### Blockers (must fix before merge)
- [{file}:{line}] {issue description}

### Warnings (should fix)
- [{file}:{line}] {issue description}

### Notes
- {any observations}

### Verdict: PASS | WARN | FAIL
```

**Sub-agent 2: Architecture Review**
```
You are reviewing code for architectural quality.

Read the skill file at `.claude/skills/review-architecture/SKILL.md` for detailed guidance.

DIFF TO REVIEW:
{paste the diff}

CHANGED FILES:
{list of files}

PROJECT ARCHITECTURE:
Read `docs/ARCHITECTURE.md` for context on established patterns.

Apply the architecture checklist from the skill. Return findings in the standard format.

### Verdict: PASS | WARN | FAIL
```

**Sub-agent 3: Readability Review**
```
You are reviewing code for readability and maintainability.

Read the skill file at `.claude/skills/review-readability/SKILL.md` for detailed guidance.

DIFF TO REVIEW:
{paste the diff}

Apply the readability checklist from the skill. Return findings in the standard format.

### Verdict: PASS | WARN | FAIL
```

**Sub-agent 4: Simplicity Review**
```
You are reviewing code for unnecessary complexity.

Read the skill file at `.claude/skills/review-simplicity/SKILL.md` for detailed guidance.

DIFF TO REVIEW:
{paste the diff}

Apply the simplicity checklist from the skill. Return findings in the standard format.

### Verdict: PASS | WARN | FAIL
```

### 3. Aggregate Results

Collect all sub-agent responses and combine into unified report:

```
# Code Review Results

## Summary
| Dimension    | Verdict | Blockers | Warnings |
|--------------|---------|----------|----------|
| Security     | {P/W/F} | {N}      | {N}      |
| Architecture | {P/W/F} | {N}      | {N}      |
| Readability  | {P/W/F} | {N}      | {N}      |
| Simplicity   | {P/W/F} | {N}      | {N}      |

## Overall: PASS | PASS WITH WARNINGS | FAIL

---

## Blockers (must fix)

### Security
- [{file}:{line}] {issue}

### Architecture
- [{file}:{line}] {issue}

[etc.]

---

## Warnings (should fix)

[grouped by dimension]

---

## Suggestions (nice to have)

[grouped by dimension]
```

### 4. Present to User

Show the aggregated report. Based on overall verdict:

- **FAIL:** "Review found blockers that must be fixed before PR."
- **PASS WITH WARNINGS:** "Review passed with warnings. Recommend fixing before PR, but can proceed."
- **PASS:** "Review passed. Code looks good for PR."

## Flags

- `/review --security-only` - Run only security review
- `/review --quick` - Run with smaller checklist (faster, less thorough)
- `/review {file}` - Review only specific file

## Notes
- Each dimension runs in parallel for speed
- Skills contain the detailed checklists and knowledge
- Blockers = must fix, Warnings = should fix, Suggestions = optional
