---
name: jira-refine
description: 'Prepare Jira stories for a refinement session: read each story against the code it would touch, then draft one comment with the questions that block implementation, the caveats, and the special cases the acceptance criteria miss, and post it once the user confirms it. Read-only on code; writes nothing but the confirmed comment; produces no plan or estimate.'
argument-hint: 'Jira key(s) to refine, and optionally the repositories likely involved'
---

# Prepare stories for refinement

Run this before a refinement session, on the stories up for discussion. Read
each story against the code it would touch and draft what an implementer
would need answered, so the session starts from concrete questions. The user
confirms each comment, and can change it, before it is posted.

This is preparation, not planning. There is no feature folder, branch, or
plan, and nothing here assumes the work will go ahead.

The audience is the team: the story's author and the people who will discuss
it. Keep the comment short and specific.

Given several keys, read and draft one story at a time, one comment per
story. Then go through the drafts with the user in turn, so they are not
kept waiting between questions.

Produce no plan file, phases, branch, estimate, or implementation. If a story
is already clear, say so in one sentence and move on. Do not raise concerns
for the sake of it.

## Boundaries

The only write is one comment per story, once the user confirms it.

- Read the story through `twg` (Atlassian Teamwork Graph CLI): description,
  acceptance criteria, linked issues, and all existing comments. A question
  may already be asked or answered.
- Read code from main checkouts only. Never read a feature folder or task
  worktree; its state is unmerged. If a main checkout is on another branch or
  has local changes, read `git -C <path> show origin/main:<file>`. Main
  checkouts are in the projects folder, the one that contains `features/`.
- Change nothing else: no files apart from the temporary one a comment is
  posted from, and no branches, Jira fields, transitions, or assignees.
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

One comment per story, for a team that may read it on a phone. Lead with
what matters, and keep every paragraph to a sentence or two. In this order:

1. **Our reading:** two or three sentences restating the story, so the team
   can correct a misreading.
2. **The questions,** numbered, blocking first. For each: the question in
   bold, on its own line; why it matters, in a sentence or two; then the
   likely answers as a list lettered A, B, C, each with what it would
   change.
3. **How to answer:** one line asking for the question's number and the
   answer's letter, such as 1B, or for the point to be raised in the
   session.
4. **Caveats and special cases,** as a list, one line each.
5. **Likely reach:** repositories and services involved, on one line.
6. **Basis:** one line naming the repositories and the commit or branch read.

Use Markdown: bold labels rather than headings, lists rather than tables,
and backticks around code names, paths, and commands. Separate every block
with a blank line, and write each paragraph and list item on one line;
Jira wraps the text. The shape, with made-up content:

```markdown
**Our reading:** retry failed dispatches; warn the customer only at the end.

**1. Which service sends the customer the notice?**

Orders and Dispatch both hold the customer's address today.

- **A. Orders:** Dispatch calls back to Orders when retries run out.
- **B. Dispatch:** Dispatch needs the notice templates too.

Reply with the number and letter, such as 1B, or bring it to refinement.

**Caveats and special cases**

- Orders placed before the change have no retry count.
- A redelivered message can start a second retry alongside the first.

**Likely reach:** `orders`, `dispatch`, and the notification service.

Based on `orders` and `dispatch` at `origin/main`, commit `4f2c1a9`.
```

Write for a reader who has not seen the code. Give file paths context, avoid
internal shorthand, and keep the tone neutral; gaps in a story are what
refinement is for.

## Confirm before posting

Nothing goes to Jira until the user confirms the exact text. In yolo mode
nothing else prompts before a post, so this step is what prevents one.
For each draft in turn:

1. Show the whole comment as the team will read it, rendered rather than
   in a code block. Say which story it goes on, and whether it is a new
   comment or an edit to an earlier one.
2. Ask the user to confirm. With a question tool such as `ask_user`, the
   choices are **Post it** and **Don't post**, and the user types changes
   in the tool's free-text input. Without one, ask in plain text.
3. On changes, revise the comment, show all of it again, and ask again.
   Only Post it, or a reply that says only to post, confirms. A
   confirmation covers the text it was given for, never a revision.
4. On Post it, post the comment exactly as last shown, with
   `twg jira workitem comment create`, or `update` for an edit. Set the
   body format to Markdown, since the default may be HTML. Pass the body
   from a temporary file outside every repository rather than inline, so
   quotes and backticks arrive intact, and delete the file afterwards.
   `--help` gives the flags. On Don't post, post nothing on that story.

## Report

For each story, report whether its comment was posted, and its most
important open question.
If a story was already clear, say so and say what you checked.

With several stories, finish with a list ordered by how much discussion each
needs, as a suggested agenda for the session.

If a story is later scheduled, `jira-plan` handles implementation planning
separately. Do not do that work here.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. No time, effort,
or duration estimates.
