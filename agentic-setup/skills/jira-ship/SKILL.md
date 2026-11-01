---
name: jira-ship
description: 'Turn an implemented, reviewed plan into commits and pull requests. Commits per phase, pushes each repository, and opens pull requests in landing order with cross-links. Writes nothing to Jira. Refuses to run on a plan that is blocked, unfinished, or unverified.'
argument-hint: 'Jira key, or nothing to use the plan in this feature folder'
---

# Ship the planned change

Land work that is implemented and reviewed: commits per phase and pull
requests in merge order. Implement nothing here. If the work is not
finished, stop and say so.

Invoking this skill authorises committing, pushing, and opening pull
requests. It does not authorise merging or deleting branches. It writes
nothing to Jira: no comment, and no change to the story's status or fields.

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
4. A repository has changes, committed or not, that the plan does not
   account for. List them and ask. Never commit unexplained changes.
5. A repository has changes but no phases in the plan.
6. `jira-review` has not run in this session since the last change. Run it.
   Continue only on `Conforms`. On `Diverges` or `Cannot tell`, stop and
   report its findings. Its suggestions for instruction files do not block
   shipping; list them in your report.
7. The plan's verification has not passed since the last change. Checks
   `jira-review` ran after the last change count. Run the rest per
   repository. If anything fails, stop and report. Report pre-existing
   failures separately; do not fix them here. Checks the plan leaves to the
   user, such as those that need a running backend, are listed as not run,
   in the report and in the pull request description.

A repository whose phases are all `done` or `dropped` and whose diff is empty
has nothing to ship. Note it in the report and continue.

## Commit

Sol does not commit during implementation, so the work is uncommitted in
each worktree. Commits already on the branch, from an earlier run or made by
hand, stay as they are. Per repository with uncommitted changes:

1. Follow the repository's commit conventions where it defines them
   (`CONTRIBUTING.md`, a commit template, recent history). Otherwise use the
   commit messages from the plan.
2. Stage only files the plan accounts for, including new files. Make one
   commit per phase, in phase order. Where phases share a file, make one
   commit for those phases and name them in the body.
3. Include the Jira key in every commit subject. Use the body for the reason
   behind the change.
4. Never commit on `main`, never amend or rebase pushed commits, and never
   include unrelated changes.

## Push and open pull requests

1. Push the feature branch per repository, setting upstream on first push.
   Never force-push. If the remote branch has diverged, stop and report.
2. Open one pull request per repository that has commits, using the plan's
   title and description. Add the plan's decisions and provisional
   decisions that concern the repository, so reviewers can object to them.
   If the branch already has an open pull request from an earlier run, push
   to it and update its description instead of opening another. Do not push
   or open anything for a repository with nothing to ship.
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

## Record and report

In the plan file, add each pull request link next to its repository.

Report to the user per repository: commits, pull request and state,
verification run, anything skipped, and anything needing their action. Do not
claim a check passed unless you ran it, or that a pull request exists unless
the host returned it.

Close with the next step: the user reviews and merges the pull requests in
landing order, and after fixes from review, runs `/jira-ship` again to push
them.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. When blocked,
report the blocker rather than working around it.
