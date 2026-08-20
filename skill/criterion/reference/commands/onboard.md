# Command: onboard

Design first-run flows, empty states, and activation paths. The moment a tool is most likely to lose a
user is the first five minutes.

## Principles

- **Show the job, not the features.** First-run demonstrates the one job that delivers value fastest,
  not a tour of ten buttons.
- **Empty states are the real onboarding** — each one is an invitation to the next action
  (domains/ux-writing.md).
- **Progress over steps:** if setup takes steps, show them honestly ("2 of 3"), allow skip everywhere,
  and never trap the user in setup.
- **Zero-state should look finished, not broken:** a new dashboard that renders five hollow cards with
  "No data" reads as an error. Give it sample/seed data with a one-click "load sample" or a
  well-designed empty invitation.

## Steps

1. Define the activation moment: the first user-visible value ("see your first deployment", "close your
   first ticket"). Everything onboards toward it.
2. Map the path to activation: what must exist before the moment (data? a connection? a member?), what
   can be deferred, what can be faked with samples.
3. Design each step's surface per the register (Configure for setup forms — clarity and safe defaults).
4. Design the empty states for every region reachable before activation (each with a next action).
5. Design the return path: what a returning user sees when they come back mid-setup ("Finish setup" chip,
   resumable state, no lost work).
6. Verify with the three users: first-time (can they reach activation alone?), returning (do they know
   where they left off?), expert (is onboarding skippable in one click?).

## Exit criteria

- Activation reachable from first-run in the minimum possible steps; every pre-activation empty state
  has a next action; skip works everywhere; nothing resets mid-flow.

## Rules

- Onboard designs the path; it doesn't build product features (a sample-data generator is in scope, a
  fake integration is not — unless the user asks).
- No confetti on completion, no mascots, no 10-step tours. The reward for finishing setup is the
  working tool.
