---
name: secure-clean-code
description: Enforces secure and clean coding practices whenever writing, modifying, refactoring, or reviewing code in any language. Use for every coding task — implementing features, fixing bugs, writing scripts, building APIs, handling user input, working with databases, authentication, file handling, or secrets. Also use when the user asks for a code review, security check, or refactoring.
---

# Secure & Clean Code

You write production-grade code: secure by default, readable, and minimal. These rules apply to every line of code you produce or change.

## Workflow — in this order

1. **Understand before you write.** Read the surrounding code, existing patterns, naming conventions, and error-handling style. New code must look like it was written by the same team.
2. **Plan the smallest change that solves the problem.** No speculative features, no "while I'm here" refactors unless asked.
3. **Write the code** following the rules below.
4. **Self-review before finishing** using the checklist at the end. Fix what you find — don't just report it.
5. **Verify.** Run existing tests, linters, and type checkers if available. If you wrote new logic, write a test for it.

## Security rules (non-negotiable)

### Input & data handling
- Treat ALL external input as hostile: user input, URL/query params, headers, cookies, file uploads, environment data, API responses, webhook payloads.
- Validate input at the boundary: type, length, range, format, allowlist. Reject invalid input with a clear error — never "fix it up" silently.
- **SQL:** parameterized queries / prepared statements only. Never build queries via string concatenation or f-strings — not even for "safe" values.
- **Shell:** avoid shelling out when a library API exists. If unavoidable, pass args as an array (no shell interpolation), never `shell=True` with user data.
- **HTML/output:** escape output for its context (HTML, attribute, JS, URL). Use the framework's templating auto-escaping; never disable it for user data.
- **Paths:** resolve and validate file paths against a base directory before use (block `../` traversal). Never use user input directly in a filesystem path.
- **Deserialization:** never deserialize untrusted data with unsafe loaders (`pickle`, `yaml.load` without SafeLoader, Java native serialization, `eval`/`Function` on strings).

### Secrets & configuration
- Never hardcode secrets, API keys, tokens, passwords, or connection strings — not in code, not in comments, not in tests, not in example files with real values.
- Read secrets from environment variables or a secret manager. Add config templates as `.env.example` with placeholder values.
- Check that `.gitignore` covers `.env`, key files, and local config before committing. Never commit a file that contains a real credential — if one is already staged or in history, stop and tell the user instead of pushing.

### Authentication & authorization
- Check authorization on every request/action server-side, not just in the UI. Verify the resource belongs to the requesting user (no IDOR: don't trust IDs from the client).
- Hash passwords with a dedicated algorithm (bcrypt, argon2, scrypt) — never MD5/SHA for passwords, never plaintext.
- Use cryptographically secure randomness for tokens and session IDs (`secrets` in Python, `crypto` in Node — never `Math.random()`/`random`).
- Set sensible session/cookie flags: `HttpOnly`, `Secure`, `SameSite`. Expire tokens.

### Errors & logging
- Fail closed: on error, deny access / abort the operation, don't continue with defaults.
- Never expose stack traces, internal paths, SQL, or library versions to end users. Log details server-side, return a generic message.
- Never log secrets, passwords, tokens, or full personal data. Mask or omit them.
- Don't swallow exceptions. Catch specific exceptions, handle them meaningfully, or let them propagate. An empty `catch`/`except: pass` is a bug.

### Dependencies
- Prefer the standard library and already-installed dependencies. Every new dependency needs a reason.
- When adding one, pick well-maintained, widely used packages; pin versions. Watch for typosquatting (exact package name).
- Don't copy code with known-vulnerable patterns from old tutorials (e.g. outdated JWT handling, `md5` password examples).

## Clean code rules

### Naming & structure
- Names say what a thing is or does: `remainingRetries`, not `n`; `isEligibleForDiscount()`, not `check()`. No abbreviations the team doesn't already use.
- Functions do one thing. If you need "and" to describe it, split it. Keep functions short enough to read without scrolling; extract when a block needs a comment to explain *what* it does.
- Max 3–4 parameters; group more into a struct/object. Avoid boolean flag parameters that change behavior — make two functions.
- Keep nesting shallow: use guard clauses / early returns instead of deep `if` pyramids.

### Simplicity
- YAGNI: build what's needed now. No abstract base classes, plugin systems, or config options for hypothetical future needs.
- DRY with judgment: extract duplication when it's the *same knowledge*, not just similar-looking lines. A little duplication beats the wrong abstraction.
- Delete dead code — don't comment it out "just in case". Version control remembers.
- Prefer boring, obvious solutions over clever ones. Code is read far more often than written.

### Comments & documentation
- Comment *why*, never *what*. If the code needs a "what" comment, rewrite the code instead.
- Document non-obvious constraints: units, invariants, external quirks ("API returns 200 with error body"), performance-critical choices.
- No noise comments (`// increment i`), no changelog comments, no commented-out code.

### Errors & types
- Make invalid states unrepresentable where the language allows: enums over magic strings, types over primitives, non-nullable by default.
- Validate early, return early. The happy path reads top-to-bottom without indentation.
- Use the language's idiomatic error mechanism consistently (exceptions vs. Result/error returns) — match the existing codebase.

### Tests
- New logic gets a test: the happy path, one boundary case, one failure case. Bug fixes get a regression test that fails without the fix.
- Tests are code too: clear names describing the scenario (`rejects_expired_token`), no logic in tests, no interdependent tests.

## Self-review checklist (run before declaring done)

Go through this concretely against your diff — not from memory:

- [ ] Any user/external input reaching SQL, shell, filesystem, HTML, or deserialization? → parameterized/escaped/validated?
- [ ] Any secret, key, or real credential in the diff? Any sensitive data in logs or error messages?
- [ ] Every new endpoint/action: authenticated AND authorized (resource ownership checked)?
- [ ] Errors: nothing swallowed, nothing leaking internals to users, fail-closed behavior?
- [ ] Names clear? Functions single-purpose? Nesting shallow? Dead code deleted?
- [ ] Matches the existing codebase's style and patterns?
- [ ] Tests written/updated and actually run? Linter/type checker clean?

If any box fails, fix it before finishing. If a security issue exists in surrounding code you didn't write, mention it to the user — don't silently ignore it, but don't refactor it unasked either.
