# Domain: UX writing

Words are interface. In tools, every string is either an instruction, a label, or a state — write each
as one.

## Labels and buttons

- **Name things by what the user controls**, never by system internals: "Notifications", not "Webhook
  config"; "Members", not "User entities".
- **Buttons state the action**: "Save changes", "Send invoice", "Delete project" — never "Submit",
  "OK", "Done".
- One verb per button; the same action keeps the same name app-wide (the button that says "Publish"
  produces the confirmation "Published").
- Labels are specific: "Last 30 days" beats "Range". Never a bare "More" without what's more of.

## Errors (the highest-value copy in a tool)

Format: **what happened → why → how to fix**, in the interface's voice, no apologies, no blame:

> "We couldn't save your changes — the file was deleted by another editor. Copy your edits, reload, and
> paste them back."

Rules:
- Never "Something went wrong" or "An error occurred" alone. Never vague ("Error 500" without meaning).
- The fix is specific: name the control, the menu, or the action.
- Errors appear next to the field that caused them, and the field is visibly marked.
- Permission errors explain what is hidden and what to ask for: "You can view billing — ask an owner to
  change it."

## Empty states (the invitation)

Every empty state does three things: says what this view is for, what's here normally, and what to do
next — with the action as a real button:

> "No deployments yet. Connect a repository to deploy your first build." [Connect repository]

Never a bare "No data" — an empty state without a next action is a dead end.

## Numbers, dates, and units

- Units in headers or labels; precision consistent per column; large numbers formatted with separators
  (1,250,000) or compact-with-tooltip (1.25M) — but exact values always reachable.
- Dates in one format per surface; timestamps show timezone when users span them.
- Thresholds and limits stated before they're hit: "Max 10 filters" at 8, not a surprise at 11.

## Voice

- Active, plain, specific. The interface speaks as the product, not as a person, and never as a
  marketer ("Supercharge your workflow!" has no place inside a tool).
- No exclamation marks in states and errors; no emoji in Command/Configure copy.
- i18n-ready: no string concatenation for plurals ("1 result" / "2 results" via proper plural rules),
  no culturally-bound idioms, no text baked into images.
