---
name: jira-ship
description: 'Turn an implemented, reviewed plan into commits, pull requests, and a Jira update. Commits per repository from the plan, pushes, opens pull requests in landing order with cross-links, and posts one comment on the story. Refuses to run on a plan that is blocked, unfinished, or unverified.'
argument-hint: 'Jira key, or nothing to use the plan in this feature folder'
---

# Ship the planned change

Land work that is implemented and reviewed: commits per repository, pull
requests in merge order, and one comment on the story. Implement nothing
here. If the work is not finished, stop and say so.

Invoking this skill authorises pushing and opening pull requests. It does
not authorise merging, deleting branches, or changing the Jira story's status.

## Scope

You run in a feature folder: one git worktree per repository, all on the same
feature branch. Read `FEATURE.md` at the folder root for the Jira key,
branch, and repositories, and check that list against what is on disk.

Writes stay inside the folder. Reads outside it come from main checkouts
only, never another feature folder or task worktree, and nothing outside is
modified.

## Preconditions

Read `.working-docs/<jira-key>.md`. Without it, do not ship. Stop and report,
changing nothing, if any of these hold:

1. The first line is not `Plan status: ready to implement`.
2. Any phase is still `pending`, unless the user says in this session to ship
   what exists.
3. A repository is not on the feature branch, or you are in a main checkout.
4. A repository has changes the plan does not account for. List them and ask.
   Never commit unexplained changes.
5. A repository has changes but no phases in the plan.
6. The plan's verification has not been run since the last change. Run it
   per repository. If anything fails, stop and report. Report pre-existing
   failures separately; do not fix them here.
7. `jira-review` has not run in this session since the last change. Run it.
   Continue only on `Conforms`. On `Diverges` or `Cannot tell`, stop and
   report its findings.

A repository whose phases are all `done` or `dropped` and whose diff is empty
has nothing to ship. Note it in the report and continue.

## Commit

Per repository with changes:

1. Follow the repository's commit conventions where it defines them
   (`CONTRIBUTING.md`, a commit template, recent history). Otherwise use the
   commit messages from the plan.
2. Stage only files the plan accounts for. One commit per phase where the
   plan separates them, otherwise one commit for the repository.
3. Include the Jira key in every commit subject. Use the body for the reason
   behind the change.
4. Never commit on `main`, never amend or rebase pushed commits, and never
   include unrelated changes.

## Push and open pull requests

1. Push the feature branch per repository, setting upstream on first push.
   Never force-push. If the remote branch has diverged, stop and report.
2. Open one pull request per repository that has commits, using the plan's
   title and description. Do not push or open anything for a repository with
   nothing to ship.
3. End every title with the Jira key in parentheses:
   `Add retry to orders (#VFS-1234)`. This applies to drafts too.
4. Use `gh` where the remote is GitHub, otherwise the host's own tooling. If
   no tooling is available, print a ready-to-paste title and body and state
   that the pull request was not created.
5. Follow the plan's landing order. A pull request whose dependency has not
   merged opens as a draft, and its description links the dependency.
6. When all are open, edit each description to list the related pull
   requests and the merge order.
7. Add reviewers, labels, or milestones only where repository convention
   requires them.
8. Do not merge or enable auto-merge.

## Update Jira

Post one comment on the story with `twg`:

1. What shipped, in a short paragraph.
2. The pull requests in landing order, each with repository and link; drafts
   marked as drafts, with what they wait on.
3. The verification run and its result.
4. Anything left undone and why: dropped phases, follow-up work, known gaps.
5. The plan file path and the feature branch.

Show the comment body, then post it. Do not change the story's status,
fields, or assignee unless the user asked in this session.

## Record and report

In the plan file, mark shipped phases and add each pull request link next to
its repository.

Report to the user per repository: commits, pull request and state,
verification run, anything skipped, and anything needing their action. Do not
claim a check passed unless you ran it, or that a pull request exists unless
the host returned it.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. When blocked,
report the blocker rather than working around it.
