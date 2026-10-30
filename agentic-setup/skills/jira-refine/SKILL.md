---
name: jira-refine
description: 'Prepare Jira stories for a refinement session: read each story against the code it would touch, then post one comment with the questions that block implementation, the caveats, and the special cases the acceptance criteria miss. Read-only on code; writes nothing but the comment; produces no plan or estimate.'
argument-hint: 'Jira key(s) to refine, and optionally the repositories likely involved'
---

# Prepare stories for refinement

Run this before a refinement session, on the stories up for discussion. Read
each story against the code it would touch and post what an implementer would
need answered, so the session starts from concrete questions.

This is preparation, not planning. There is no feature folder, branch, or
plan, and nothing here assumes the work will go ahead.

The audience is the team: the story's author and the people who will discuss
it. Keep the comment short and specific.

Given several keys, handle them one at a time and post one comment per story.

Produce no plan file, phases, branch, estimate, or implementation. If a story
is already clear, say so in one sentence and move on. Do not raise concerns
for the sake of it.

## Boundaries

The only write is one comment per story.

- Read the story through `twg` (Atlassian Teamwork Graph CLI): description,
  acceptance criteria, linked issues, and all existing comments. A question
  may already be asked or answered.
- Read code from main checkouts only. Never read a feature folder or task
  worktree; its state is unmerged. If a main checkout is on another branch or
  has local changes, read `git -C <path> show origin/main:<file>`. Main
  checkouts are in the projects folder, the one that contains `features/`.
- Change nothing else: no files, branches, Jira fields, transitions, or
  assignees.
- If no repository is named and the code involved is unclear, say which
  repositories you looked at and how confident you are, or ask.

## Read first

1. Restate what the story asks for, in your own words. If you cannot, that is
   the first finding.
2. Find the code that would change: the controlling path, its callers, the
   contracts it exposes, and the tests that cover it.
3. Note what the code implies that the story does not mention: behaviour that
   would change, unlisted callers, data that would need migrating, flags or
   config that gate the area.
4. If an earlier refinement comment exists, extend or correct it instead of
   repeating it.

## What to look for

- **Blocking questions.** Where a wrong guess is expensive or cannot be
  undone: ownership of behaviour, contracts between services or teams,
  schemas and migrations, permissions, anything users or other systems
  observe. Say why each matters and what the likely answers would change.
- **Caveats.** Where the work is harder than the story suggests: backwards
  compatibility, data volume, migrations without an obvious rollback, areas
  without test coverage, dependencies on unbuilt work.
- **Special cases.** What the acceptance criteria do not cover: empty and
  first-run states, concurrent or repeated requests, partial failure,
  permissions, records that predate the change.
- **Reach.** Which repositories and services the work likely touches, and
  what that means for sequencing. This informs sizing; it is not an estimate.

Rank findings by whether they change the outcome. Lead with those. Put minor
points in a short list at the end, or leave them out.

## Write the comment

One comment per story, posted with `twg`:

1. **Understanding:** two or three sentences restating the story, so the team
   can correct a misreading.
2. **Questions:** numbered, blocking first, each with why it matters and what
   the answers would change.
3. **Caveats and special cases.**
4. **Likely reach:** repositories and services involved.
5. **Basis:** one line naming the repositories and the commit or branch read.

Write for a reader who has not seen the code. Give file paths context, avoid
internal shorthand, and keep the tone neutral; gaps in a story are what
refinement is for.

Show the comment body, then post it.

## Report

For each story, report what was posted and its most important open question.
If a story was already clear, say so and say what you checked.

With several stories, finish with a list ordered by how much discussion each
needs, as a suggested agenda for the session.

If a story is later scheduled, `jira-plan` handles implementation planning
separately. Do not do that work here.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. No time, effort,
or duration estimates.
