# Contributing to KiddieOps

Thanks for working on KiddieOps! This document covers how we branch, commit, review, and track work as a two-person team so we stay in sync and the repo history stays readable for grading.

## Ground rules

- Every change to `main` goes through a Pull Request, even on a small team — it keeps history clean and gives us a paper trail for the course evaluation.
- Reference the requirement ID (e.g. `REQ15`, `NFR04`) from `docs/KiddieOps_SRS.docx` in your branch, commit, or PR whenever a change implements or affects one. This keeps the traceability matrix meaningful.
- No direct commits to `main`. Work happens on feature branches.
- Keep PRs small and scoped to one feature or fix where possible — easier to review, easier to revert if something breaks.

## Branch naming

Use the pattern:

```
<type>/<short-description>-<REQ-id-if-applicable>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

Examples:

```
feat/attendance-checkin-REQ15
feat/ai-guardian-chat-ui-REQ30
fix/child-profile-validation-REQ08
docs/update-architecture
chore/setup-eslint
```

## Commit messages

We follow a simplified [Conventional Commits](https://www.conventionalcommits.org/) style:

```
<type>: <short summary>

[optional body — what & why, not how]
[optional: Implements REQ15, REQ17]
```

Examples:

```
feat: add caregiver attendance check-in form

Implements REQ15. Caregivers can now select a classroom/group and
date, then mark check-in/check-out and status per child.
```

```
fix: prevent parent accounts from viewing other children's medical records

Closes a role-check gap in the medical records endpoint. Relates to
REQ22, NFR05.
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull requests

1. Push your branch and open a PR against `main`.
2. Fill in the PR description with:
   - What the PR does (1–3 sentences)
   - Which requirement ID(s) it implements or touches
   - How you tested it (manual steps, screenshots for UI changes, or test commands)
3. Request review from the other team member. At least **one approval** is required before merging.
4. Resolve all review comments before merging — don't merge over an unresolved "changes requested."
5. Squash-merge into `main` once approved, and delete the branch afterward.

## Code review expectations

When reviewing a teammate's PR:

- Check the change against the relevant requirement in the SRS — does it actually satisfy what was specified?
- Look for obvious security gaps, especially around role-based access and medical record permissions (this project handles sensitive child data — treat it accordingly).
- Point out bugs and risky patterns directly, but keep feedback constructive — we're both learning.
- It's fine to approve with minor comments ("nit: rename this variable") — blocking is reserved for real issues (security, broken functionality, requirement mismatch).

## Working with the SRS

`docs/KiddieOps_SRS.docx` is the source of truth for scope. If a feature request comes up that isn't in the SRS:

1. Discuss it with your teammate first.
2. If it's in scope for v1.0, add it to `docs/KiddieOps_SRS.docx` with a new REQ ID and priority before building it.
3. If it's a "nice to have" beyond v1.0, note it in `docs/tasks.md` under a "Future / Backlog" section instead of building it now — protect the timeline.

## Environment & secrets

- Never commit `.env` files, API keys, or database credentials.
- Add any new environment variable to the example block in `README.md` (with a placeholder value) when you introduce it.

## Task tracking

Active sprint work lives in [`docs/tasks.md`](docs/tasks.md). Move items across status as you work, and keep the REQ ID reference so we can trace progress back to the SRS.

## Questions

If something in this doc is unclear or doesn't fit how we're actually working, raise it and we'll update it — this file should reflect our real process, not the other way around.
