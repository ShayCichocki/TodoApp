---
name: review-readability
description: Readability-focused code review. Checks for clarity, naming, documentation, and maintainability.
---

# Readability Review

Review code changes for clarity, maintainability, and ease of understanding.

## Philosophy

**Code is read more than written.** Optimize for the reader, not the writer. Clear code saves time for everyone who comes after.

**Names are documentation.** Good names eliminate the need for comments. Bad names require comments that can become stale.

**Complexity is the enemy.** Simple code that's easy to understand beats clever code that requires explanation.

## Checklist

### Naming

- [ ] **Descriptive Names:** Do names clearly describe what things are/do?
- [ ] **Consistent Vocabulary:** Are similar concepts named consistently?
- [ ] **Appropriate Specificity:** Are names specific enough without being verbose?
- [ ] **No Abbreviations:** Are abbreviations avoided (except well-known ones)?
- [ ] **Boolean Names:** Do boolean variables/functions read as yes/no questions? (isValid, hasPermission)

### Function Design

- [ ] **Reasonable Size:** Are functions small enough to understand at a glance? (< 30 lines ideal)
- [ ] **Single Purpose:** Does each function do one thing?
- [ ] **Clear Parameters:** Are parameter names descriptive? Reasonable count? (< 4 ideal)
- [ ] **Obvious Return:** Is it clear what functions return?

### Code Structure

- [ ] **Logical Flow:** Does code read top-to-bottom in logical order?
- [ ] **Nesting Depth:** Is nesting kept shallow? (< 3 levels ideal)
- [ ] **Early Returns:** Are guard clauses used to reduce nesting?
- [ ] **Grouping:** Are related lines grouped together? Blank lines separating concepts?

### Comments & Documentation

- [ ] **Why, Not What:** Do comments explain WHY, not WHAT? (code shows what)
- [ ] **No Stale Comments:** Are comments accurate and up-to-date?
- [ ] **No Commented Code:** Is dead code deleted, not commented?
- [ ] **Type Annotations:** Are types clear and helpful?

### Complexity Indicators

- [ ] **No Magic Numbers:** Are constants named and explained?
- [ ] **No Clever Code:** Is the code straightforward, not "clever"?
- [ ] **Obvious Logic:** Can the logic be understood without running it?
- [ ] **No Hidden Side Effects:** Are side effects obvious from function names?

### Consistency

- [ ] **Formatting:** Does formatting match the rest of the codebase?
- [ ] **Style:** Does style match project conventions?
- [ ] **Patterns:** Are similar problems solved in similar ways?

## Severity Guidelines

**Blocker (must fix):**
- Completely unclear code that future maintainers won't understand
- Misleading names that suggest wrong behavior
- Missing critical documentation for complex algorithms

**Warning (should fix):**
- Overly long functions (> 50 lines)
- Deep nesting (> 3 levels)
- Unclear variable names
- Missing comments on non-obvious logic

**Note (consider):**
- Minor naming improvements
- Opportunities to simplify
- Suggestions for clearer structure

## Output Format

```
## Readability Review

### Blockers
- [src/utils/transform.ts:12-89] Function `processData` is 77 lines with 5 levels of nesting - impossible to follow

### Warnings
- [src/api/handler.ts:34] Variable `d` should have descriptive name (appears to be "document")
- [src/services/sync.ts:56-78] Complex logic with no comments explaining the algorithm
- [src/components/Form.tsx:23] Magic number `86400000` should be named constant (milliseconds in day?)

### Notes
- [src/utils/helpers.ts:12] Function `getUserData` could be renamed to `fetchUserProfile` for clarity
- Consider extracting the validation logic in lines 45-67 into a named function

### Verdict: WARN
Code is understandable but has readability issues that should be addressed.
```
