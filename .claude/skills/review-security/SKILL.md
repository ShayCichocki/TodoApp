---
name: review-security
description: Security-focused code review. Checks for vulnerabilities, injection attacks, auth issues, and data exposure.
---

# Security Review

Review code changes for security vulnerabilities and unsafe patterns.

## Philosophy

**Defense in depth.** Don't rely on a single security control. Look for places where multiple layers should exist.

**Trust boundaries matter.** Identify where data crosses trust boundaries (user input, external APIs, database). These are high-risk areas.

**Fail secure.** When things go wrong, they should fail closed, not open. Check error handling paths.

## Checklist

### Injection Vulnerabilities

- [ ] **SQL Injection:** Are queries parameterized? No string concatenation with user input?
- [ ] **Command Injection:** Are shell commands using safe APIs? No `exec()` with user input?
- [ ] **XSS:** Is user content escaped before rendering? Using safe templating?
- [ ] **Template Injection:** Are template engines configured safely?
- [ ] **Path Traversal:** Are file paths validated? No `../` sequences from user input?

### Authentication & Authorization

- [ ] **Auth Checks:** Are endpoints properly protected? No missing auth middleware?
- [ ] **Authorization:** Are users authorized for the specific resource, not just authenticated?
- [ ] **Session Management:** Are sessions handled securely? Proper expiration?
- [ ] **Token Handling:** Are tokens stored securely? Not in localStorage for sensitive apps?

### Data Exposure

- [ ] **Logging:** Are sensitive values (passwords, tokens, PII) excluded from logs?
- [ ] **Error Messages:** Do errors expose internal details (stack traces, SQL, paths)?
- [ ] **API Responses:** Are responses filtered to exclude sensitive fields?
- [ ] **Source Control:** Are secrets kept out of code? Using environment variables?

### Cryptography

- [ ] **Hardcoded Secrets:** No API keys, passwords, or tokens in code?
- [ ] **Weak Crypto:** Using modern algorithms? No MD5/SHA1 for security purposes?
- [ ] **Random Values:** Using cryptographic randomness for security-sensitive values?

### Dependencies & Configuration

- [ ] **Known Vulnerabilities:** Are dependencies up to date? Any known CVEs?
- [ ] **CORS:** Is CORS configured restrictively? Not `*` for sensitive endpoints?
- [ ] **CSRF:** Are state-changing requests protected against CSRF?
- [ ] **Headers:** Are security headers set (CSP, X-Frame-Options, etc.)?

## Severity Guidelines

**Blocker (must fix):**
- Any injection vulnerability
- Missing authentication on sensitive endpoints
- Exposed secrets or credentials
- Direct data exposure of PII

**Warning (should fix):**
- Overly permissive CORS
- Missing security headers
- Logging sensitive data
- Weak but not broken crypto

**Note (consider):**
- Outdated but not vulnerable dependencies
- Missing rate limiting
- Verbose error messages (non-sensitive)

## Output Format

```
## Security Review

### Blockers
- [src/api/users.ts:45] SQL injection: User input concatenated into query
- [src/auth/login.ts:23] Hardcoded API key in source

### Warnings
- [src/server.ts:12] CORS allows all origins (*)
- [src/utils/logger.ts:34] Password field logged in debug mode

### Notes
- Consider adding rate limiting to /api/auth endpoints
- CSP header not set (low risk for API-only backend)

### Verdict: FAIL
Found 2 blockers that must be fixed.
```
