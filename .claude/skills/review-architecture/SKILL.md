---
name: review-architecture
description: Architecture-focused code review. Checks for pattern consistency, separation of concerns, and dependency direction.
---

# Architecture Review

Review code changes for architectural quality and consistency with established patterns.

## Philosophy

**Consistency over perfection.** A consistent codebase is more maintainable than one with scattered "perfect" solutions. Follow existing patterns unless there's a strong reason to change them.

**Dependencies flow inward.** Core business logic shouldn't depend on external frameworks or infrastructure. Check that dependencies point in the right direction.

**Explicit boundaries.** Clear separation between layers (API, business logic, data access) makes code easier to test and modify.

## Before You Start

1. Read `docs/ARCHITECTURE.md` to understand the project's established patterns
2. Note the key architectural decisions and conventions
3. Review changes in context of these patterns

## Checklist

### Pattern Consistency

- [ ] **Follows Existing Patterns:** Does new code match how similar features are implemented?
- [ ] **Naming Conventions:** Do files, functions, and variables follow project conventions?
- [ ] **File Organization:** Are files in the expected locations per project structure?
- [ ] **API Patterns:** Do new endpoints follow established API design patterns?

### Separation of Concerns

- [ ] **Single Responsibility:** Does each module/function do one thing well?
- [ ] **Layer Violations:** Is business logic leaking into API handlers or UI components?
- [ ] **Data Access:** Is database access isolated to appropriate layers?
- [ ] **Side Effects:** Are side effects (I/O, state changes) isolated and explicit?

### Dependency Management

- [ ] **Dependency Direction:** Do dependencies flow toward the core, not away?
- [ ] **Circular Dependencies:** Are there any new circular imports?
- [ ] **Appropriate Coupling:** Are modules loosely coupled? Can they be tested independently?
- [ ] **New Dependencies:** Are new external dependencies justified and appropriate?

### Error Handling

- [ ] **Consistent Error Types:** Are errors using established error types/patterns?
- [ ] **Error Boundaries:** Are errors handled at appropriate levels?
- [ ] **Recovery Paths:** Are failure cases handled gracefully?

### State Management

- [ ] **State Location:** Is state stored in appropriate places (not duplicated)?
- [ ] **State Updates:** Are state changes predictable and traceable?
- [ ] **Shared State:** Is shared mutable state minimized?

### Testability

- [ ] **Mockable Dependencies:** Can dependencies be easily mocked for testing?
- [ ] **Pure Functions:** Are computations pure where possible?
- [ ] **Interface Boundaries:** Are interfaces well-defined for testing?

## Severity Guidelines

**Blocker (must fix):**
- Circular dependencies introduced
- Core business logic depending on infrastructure
- Major pattern violations that will cause maintenance issues
- Breaking existing architectural boundaries

**Warning (should fix):**
- Minor pattern inconsistencies
- Missed opportunities for abstraction
- Slightly misplaced code (wrong layer)
- Missing error handling

**Note (consider):**
- Suggestions for cleaner organization
- Potential future refactoring opportunities
- Alternative patterns that might work better

## Output Format

```
## Architecture Review

### Blockers
- [src/components/UserList.tsx:45] Business logic in UI component - filtering should be in service layer
- [src/core/user.ts:12] Core module imports from infrastructure (src/db/client.ts)

### Warnings
- [src/api/routes.ts:78] Error handling pattern differs from other endpoints
- [src/services/auth.ts:23] Direct database call - should use repository pattern per ARCHITECTURE.md

### Notes
- Consider extracting validation logic into shared utility
- New API endpoint follows REST conventions nicely

### Verdict: FAIL
Found 2 blockers that violate architectural boundaries.
```
