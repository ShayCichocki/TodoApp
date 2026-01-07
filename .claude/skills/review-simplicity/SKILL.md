---
name: review-simplicity
description: Simplicity-focused code review. Checks for over-engineering, unnecessary abstraction, and premature optimization.
---

# Simplicity Review

Review code changes for unnecessary complexity and over-engineering.

## Philosophy

**YAGNI (You Aren't Gonna Need It).** Don't build for hypothetical futures. Solve today's problem today. When the future arrives, you'll know more about what's actually needed.

**Three strikes, then abstract.** Don't create abstractions for one or two uses. Wait until you see the pattern three times before extracting it.

**Simple is not easy.** Simple solutions often require more thought than complex ones. The goal is "as simple as possible, but no simpler."

## Red Flags

Watch for these patterns that often indicate over-engineering:

1. **Premature Abstraction:** Creating interfaces/abstractions for single implementations
2. **Speculative Generality:** Building "flexibility" for requirements that don't exist
3. **Layer Cake:** Too many layers of indirection for simple operations
4. **Config Everything:** Making things configurable that will never change
5. **Framework Mindset:** Building reusable frameworks for one-time problems

## Checklist

### Abstraction Level

- [ ] **Justified Abstraction:** Does each abstraction have 2+ implementations or clear future need?
- [ ] **Appropriate Indirection:** Is each layer of indirection earning its keep?
- [ ] **Direct Solutions:** Could this be solved more directly without losing clarity?
- [ ] **No Wrapper Wrappers:** Are there wrappers that just pass through to other wrappers?

### Code Volume

- [ ] **Minimal Code:** Is this the minimum code needed to solve the problem?
- [ ] **No Copy-Paste Abstraction:** Are abstractions solving real duplication, not just similar-looking code?
- [ ] **No Dead Flexibility:** Are there unused parameters, options, or configuration?
- [ ] **No Premature DRY:** Is duplication being tolerated appropriately before abstracting?

### Dependencies

- [ ] **Justified Dependencies:** Is each new dependency earning its weight?
- [ ] **No Micro-Libraries:** Could this be done with a few lines instead of a dependency?
- [ ] **Appropriate Tools:** Is the solution proportional to the problem?

### Future-Proofing

- [ ] **No Speculative Features:** Are all features actually used/needed now?
- [ ] **No "Just In Case" Code:** Is there code handling scenarios that can't happen?
- [ ] **No Placeholder Architecture:** Are there empty interfaces, unused hooks, or stub implementations?
- [ ] **Appropriate Scope:** Does the solution scope match the problem scope?

### Patterns & Practices

- [ ] **Pattern Appropriateness:** Are design patterns used when they simplify, not complicate?
- [ ] **No Pattern Addiction:** Is the solution shaped by the problem, not by pattern love?
- [ ] **Boring Technology:** Are standard/boring solutions chosen over novel/clever ones?

## Questions to Ask

1. "If I delete this abstraction, what breaks?" (If nothing, delete it)
2. "What's the simplest thing that could work?" (Start there)
3. "Am I solving a real problem or an imagined one?"
4. "Would a new team member understand why this complexity exists?"
5. "What would this look like without [this pattern/abstraction]?"

## Severity Guidelines

**Blocker (must fix):**
- Massive over-engineering that will burden future development
- Unnecessary dependencies adding significant complexity
- Abstractions that make the code harder to understand than inline code would

**Warning (should fix):**
- Premature abstractions (single implementation behind interface)
- Speculative features or configuration
- Unnecessary design patterns
- Over-complicated solutions to simple problems

**Note (consider):**
- Opportunities to simplify
- Places where less code would do
- Abstractions that might be premature

## Output Format

```
## Simplicity Review

### Blockers
- [src/services/DataProcessorFactory.ts] Factory pattern for single processor type - just instantiate directly

### Warnings
- [src/utils/configurable-validator.ts] Validator has 12 configuration options but only 2 are used
- [src/core/events.ts] Event system with pub/sub for single subscriber - direct call would suffice
- [package.json] Added `left-pad` dependency for single string operation

### Notes
- [src/api/middleware.ts:34-56] This could be simplified to a single function instead of class
- Consider if the Repository pattern is needed when there's only one data source

### Verdict: WARN
Some over-engineering detected. Code works but is more complex than necessary.
```
