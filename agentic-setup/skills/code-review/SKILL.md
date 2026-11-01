---
name: code-review
description: 'Review the current change for regressions and must-fix issues before it ships or merges: every repository in a feature folder, or a single repository, against its base branch, with uncommitted and new untracked files included. Use for code review, compatibility and contract checks, security and performance risks, test gaps, and deployment safety. Read-only. Does not read Jira or the plan; jira-review checks the change against the plan.'
argument-hint: 'Pull request, branch, commit, path, or base to compare with; nothing for the current change'
---

# Code review

Review the change for plausible failures in existing behaviour, consumers,
data, operations, or deployment. This review asks whether the code is
correct; `jira-review` asks whether the change is what the plan agreed. In a
feature folder, run it after `/jira-review`, once the change is known to
match the plan, and before `/jira-ship`.

The review is read-only. Do not edit, stage, or commit, and do not comment on
pull requests unless the user asks. It neither reads nor writes Jira. Report
findings and let the user decide what to fix.

## Scope

Honour a pull request, branch, commit, path, or base the user names.
Otherwise review the current change in the working directory:

1. **Feature folder:** one git worktree per repository, all on the same
   feature branch. Read `FEATURE.md` at the folder root if present, and check
   its repository list against what is on disk. Every immediate subdirectory
   that is a git worktree is in scope; review each one, including any you
   expect to be unchanged. The folder root, with `FEATURE.md` and
   `.working-docs/`, belongs to no repository and is not reviewed.
2. **Single repository:** review that one.
3. If it is neither, report what you found and ask.

In each repository, review the whole change against its base: commits on the
branch, staged and unstaged changes, and new untracked files. Before
`jira-ship`, the work is usually all uncommitted, so a review of commits
alone finds nothing.

- **Base.** The pull request's base branch, if the branch has one
  (`gh pr view`); otherwise the remote's default branch
  (`git symbolic-ref refs/remotes/origin/HEAD`). Do not assume `origin/main`.
  If the base is unclear and a wrong choice would change the review, ask;
  otherwise state the assumption.
- **Diff.** Find the merge base with the base branch. Look at
  `git diff --name-status <merge-base>` and `--stat` first, then read
  `git diff <merge-base>`, which shows commits, staged, and unstaged changes
  together.
- **New files.** List them with `git ls-files --others --exclude-standard` and
  read each in full. `git diff` does not show them.
- Do not fetch, check out, stash, or otherwise change a worktree to review
  it. If a base cannot be established, review what you can and say the scope
  was limited.
- In a feature folder, write paths relative to the folder root, prefixed with
  the repository name.

Reading other repositories follows the same rules as elsewhere: main
checkouts only, never another feature folder or task worktree, and nothing
is modified. Main checkouts are in the projects folder, the one that
contains `features/`.

## Gather context

1. Check each repository's branch and status, then read its instruction
   files: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and the
   `.github/instructions/` files that apply. Copilot does not load them in a
   feature folder. Note the rules and required checks that bear on the
   change.
2. Read the diff in manageable sections. Follow affected call sites, tests,
   schemas, configs, and surrounding code until the impact is clear. The
   changed lines are not the whole contract.
3. Where a change alters a contract that another repository depends on (an
   API, event, schema, or shared package), read its consumers: in the other
   worktrees, and in the main checkouts of repositories outside the folder.

Review the diffs yourself. Wide reading, such as tracing callers or searching
other repositories for consumers, can go to workers. A worker does not see
this skill, so tell it what to look for, and confirm what it reports in the
code before you report it.

## Checks

For each meaningful change, identify what depends on the old behaviour: an
existing caller, flow, persisted record, configuration, or external
consumer. Check the relevant perspectives, without manufacturing a finding
for each:

1. **Behaviour and contracts.** Edge cases, errors, validation, public
   signatures, APIs, events, DTOs, serialisation, configs, environment
   variables, and flags.
2. **Data and rollout.** Old data shapes, null and default values, schema
   migrations, mixed-version deployments, rollback, retries, ordering,
   idempotency, and concurrency. Where repositories depend on each other:
   which must deploy first, and what breaks while only one side is deployed.
3. **Security.** Authentication, authorisation, trust boundaries, input
   handling, secrets, and data exposure.
4. **Performance and reliability.** Query shape, allocation or blocking
   regressions, graceful degradation, observability, and operational
   compatibility.
5. **Tests and design.** Whether tests protect the existing scenarios the
   change affects, and cross-layer changes that create a concrete breakage
   risk.

Make several focused passes when the change warrants it. Run focused checks
or tests where they can confirm or rule out a specific suspected failure,
and report what ran. A check that needs a running backend is the user's
step; list it as a gap.

Report only issues with a plausible failure mode, meaningful impact, and
concrete evidence. Merge duplicates, including one issue seen from both
sides of a contract. Leave out style nits, praise, speculative risks, and
test gaps without an identifiable behaviour at risk.

## Report

Lead with the findings, numbered and ordered by severity: Critical, High,
Medium, and Low only for a concrete issue worth fixing. For each:

- A short title, and the repository, file, and line.
- The breaking scenario, and why it follows from the code.
- Whether it is demonstrated or needs confirmation.
- The smallest practical fix or verification.

If there are no material findings, say so explicitly.

Then, only where they affect confidence, open questions and assumptions.
Then coverage: per repository, the base it was compared with and the number
of changed and new files, or that it has no changes; and the gaps, such as
checks not run, callers not inspected, or rollout uncertainty. End with a
brief summary.

The user decides which findings to fix. In a feature folder, close with the
next steps: tell Sol which findings to fix, by number, then run
`/jira-ship`, which reviews the fixes against the plan before it commits.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. Do not restate
the diff. Report the findings, what limits confidence in them, and what the
review did not cover.
