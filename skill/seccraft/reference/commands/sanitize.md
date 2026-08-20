# Command: sanitize

Input/output handling: the injection and XSS defense pass (`domains/injection.md` is the
authority). One habit applied to every sink: **input is data, and it's treated as data at every
boundary.**

## Steps

1. Inventory the sinks in the target: SQL statements, HTML/DOM insertion, shell calls, file
   paths, URL fetches/redirects, templates, deserialization (`domains/injection.md`'s table).
2. For each sink, apply the matching defense:
   - **SQL** → bound parameters; dynamic identifiers (column names, order-by) go through an
     allowlist — never the input directly.
   - **HTML/DOM** → text nodes and proper escaping per context; `innerHTML`/
     `dangerouslySetInnerHTML` with data becomes text nodes or a vetted sanitizer (DOMPurify)
     with a strict config; inline event handlers removed.
   - **Shell** → argument arrays without a shell; no string-built commands.
   - **Paths** → resolve and verify the result stays inside the allowed root.
   - **URLs** → allowlist scheme/host/port; block internal ranges and re-validate redirects
     (SSRF defense).
   - **Deserialization** → refuse untrusted input; safe codecs only.
3. Add the boundary validation: declared types, lengths, ranges, formats — rejected with one
   consistent error (`domains/injection.md` rule 2).
4. Add or tighten the CSP (defense in depth for XSS): `script-src 'self'` as the starting
   position, nonces/hashes for the inline scripts that must exist.
5. Prove each fix: the injection case that previously succeeded now fails — the XSS payload
   renders as text, the SQL attempt is a parameter error, the traversal stays in the root.

## Exit criteria

- Every sink in the target uses its parameterized/escaped mechanism; boundary validation
  present; CSP tightened or justified; the attack cases fail clean.

## Rules

- Sanitize fixes the *handling*; it doesn't redesign the feature. The data still flows — it
  just can't execute.
- Output encoding is per-context (HTML ≠ attribute ≠ JS ≠ URL) — one escape function does not
  fit all.
- A sanitizer with an allowlist is a control; a blocklist sanitizer is a race the attacker is
  winning.
