# /capture

Quickly capture a bug, idea, or future task without full specification.

## Instructions

Use this for low-friction capture of ideas that shouldn't derail current work.

### 1. Gather Minimum Info

From the user's input, identify:
- **Title**: One-line description (required)
- **Type**: Bug, Feature, or Task (infer from context)
- **Project**: Which milestone? (default: Backlog)
- **Context**: Any additional details provided

### 2. Create Beads Issue

Use `bd create` with:
- Title from user input
- Label: `bug`, `feature`, or `task`
- Status: Backlog (or Triage if unclear)
- Description: Brief context if provided, otherwise leave minimal

### 3. Confirm

Report back:
```
Captured: [ISSUE-ID] Title
Project: [Project name]
Status: Backlog

Run /spec on this issue when ready to implement.
```

## Examples

**User:** "We should add dark mode eventually"
```
Captured: [FLT-99] Add dark mode support
Project: Backlog
Status: Backlog
```

**User:** "Bug: file tree doesn't refresh after upload"
```
Captured: [FLT-100] File tree doesn't refresh after upload
Project: M2 Storage Architecture
Status: Backlog
Label: bug
```

**User:** "Capture: need to add rate limiting to the API"
```
Captured: [FLT-101] Add rate limiting to API
Project: Backlog
Status: Backlog
```

## Notes

- No spec required - just get it captured
- Don't interrupt flow asking for details - infer what you can
- User can run `/spec` later to flesh out the issue before implementation
- Good for mid-session ideas that shouldn't derail current work
- If user provides a project name, use it; otherwise default to Backlog
