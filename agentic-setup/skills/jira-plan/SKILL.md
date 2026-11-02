---
name: jira-plan
description: 'Create one implementation plan for Jira stories across every repository in a feature folder. Use for Jira planning, phased implementation plans, acceptance criteria coverage, verification commands, and commit and PR suggestions. Interviews the user first, defers unresolved questions to the story as a single comment that the user approves before it is posted, and stops without implementing.'
argument-hint: 'Jira key(s) and optional scope or constraints'
---

# Jira implementation plan

Plan the requested work across every repository in scope, without
implementing it. Investigation is read-only. This skill makes at most three
writes:

1. The plan file.
2. The `jira:` field in `FEATURE.md`, if it is empty and a key was given.
3. One comment on the story, if any question is deferred and the user
   approves its text.

Do not create branches, worktrees, commits, pull requests, or code changes.
Do not include time, effort, or duration estimates.

## Scope

You run in a feature folder: one git worktree per repository, all on the same
feature branch. The plan and every change belong to the folder as a whole; no
single repository in it is the root of the task.

1. Read `FEATURE.md` at the folder root if present. It records the Jira key,
   branch, and repositories. Take identity from it, and check its repository
   list against what is on disk.
2. Every immediate subdirectory that is a git worktree is in scope. If the
   working directory is a single repository, say so and plan for that one. If
   it is neither, report what you found and ask.
3. Record each repository's path and branch. The branch already exists; do
   not propose creating it.
4. Write one plan covering every repository. Never one plan per repository.
5. Run commands from the folder root, changing into a repository only when a
   command must run there. Write paths relative to the folder root, prefixed
   with the repository name.

### Repositories that join or drop out

Working out which repositories are involved is part of planning.

- If investigation shows the work needs a repository that is not in the
  folder, name it, say what it needs and why, and ask for its worktree to be
  added. Continue planning once it is there, and note that it joined
  mid-plan.
- Never plan edits into a repository outside the folder. Either its worktree
  joins, or that work is out of scope and the plan says so.
- A repository in the folder may turn out to need no changes. That is a
  normal outcome. Mark its phases `dropped` with the reason, so no later step
  mistakes the empty diff for unfinished work.

### Reading outside the folder

Reading other repositories is allowed and often necessary: internal
dependencies, shared libraries, contracts owned by another team. Two rules
apply.

- **Read only.** Nothing outside the feature folder is modified.
- **Main only.** Read a repository's main checkout. Never read another feature
  folder or task worktree; its state is unmerged and may never land. If a
  main checkout is on another branch or has local changes, read
  `git -C <path> show origin/main:<file>` instead, and say so.

Main checkouts are in the projects folder, the one that contains
`features/`. A repository you only need to read is read from its main
checkout and does not need a worktree. Record in the plan which outside
repositories you read and what you relied on from them.

## Resume an earlier plan

If `.working-docs/<jira-key>.md` exists, build on it. Carry forward every
decision it records, and do not reopen one unless the user asks.

- **Blocked:** an earlier run stopped on open questions. Re-read the story,
  including comments since that run, for answers. Ask only what is still
  unanswered.
- **Ready:** the user wants the plan revised. Apply what they ask,
  investigating only what the change touches, and keep the rest, including
  phase statuses and the `Lessons` section.

## Gather context

1. Read the story through `twg` (Atlassian Teamwork Graph CLI): description,
   acceptance criteria, linked issues, and comments. If access or details are
   missing, ask. Do not invent requirements.
2. Read the conventions in each repository: `AGENTS.md`, `CLAUDE.md`,
   `.github/copilot-instructions.md`, relevant `.github/instructions/` and
   `.github/skills/`, `CONTRIBUTING.md`, `README.md`. Note only rules that
   affect the plan. More specific rules take precedence.
3. Read the architecture decision records (ADRs) in each repository that
   has them. Look where its instructions say, otherwise in `docs/adr/`,
   `doc/adr/`, `docs/decisions/`, or `adr/`. Skim the titles or index, then
   read the ADRs that touch the area being changed. Note each one's status:
   an accepted ADR binds the plan, and a superseded one names the ADR that
   replaced it. ADRs in a repository outside the folder, such as a shared
   architecture repository, are read from main like any other outside read.
4. Find the controlling code path, nearby tests, affected callers and
   contracts, and the build, test, and lint commands in each repository.
   Identify cross-repository contracts first (APIs, events, schemas, shared
   packages); they determine the order work must land in.
5. Prefer the smallest workable slice. Do not scan unrelated areas or run
   commands that change state.

## Interview the user

Do this before drafting phases.

Ask only questions whose answers change the plan. Sort each one first:

- **Reversible:** a wrong answer costs an edit later. Naming, internal
  structure, where a helper lives, the order of independent work. Decide it
  yourself and record it as a provisional decision, with the default chosen
  and the cost of changing it. Do not ask, and never let one of these stop
  the run.
- **Blocking:** a wrong answer is expensive or cannot be undone. Schemas and
  migrations, contracts between repositories or teams, ownership of
  behaviour, security and permissions, anything users or other systems can
  observe, and any departure from an accepted ADR.

If you cannot tell which it is, treat it as blocking.

1. List the blocking questions together, numbered, so the user sees the
   whole set. Then ask them one at a time, each with its options in this
   order:

   1. The suggested options, each with what it means for the
      implementation.
   2. **Your own answer**, in free text.
   3. **Defer to the team**, always last. State that choosing it stops the
      run, once the interview is over, until the team answers.

   With a question tool such as `ask_user`, the choices are the suggested
   options followed by Defer to the team. The user types their own answer
   in the tool's free-text input, so do not add a choice for it. If the tool
   cannot take free text, ask in plain text instead.
2. Treat a free-text answer as a decision like any other. If it is unclear,
   or conflicts with what the code shows, say so and ask a follow-up before
   recording it.
3. Record each answer as a decision, with the reasoning given.
4. Record each deferral with the context needed to answer it, the options
   considered, and what each outcome would change. Several questions may be
   deferred; collect them all and post nothing until the interview ends.
5. Do not assume an answer to a blocking question.

Only a deferred blocking question stops the run. Provisional decisions are
listed in the plan, and `jira-ship` adds them to the pull request
descriptions, so the team can object without being asked to decide. If
anything is deferred, this skill's comment lists them too.

## Build the plan

Write for an implementer who was not part of this conversation and has only
the plan and the repositories, possibly days later. Anything learned while
investigating is lost unless the plan records it: exact names, versions, and
endpoints; approaches considered and rejected, with the reason; files that
look relevant and are not.

Match depth to risk. A one-file change gets a short plan.

Steps must be concrete: name the file, the symbol, and the change. "Update
the handler" is not a step. Attribute every step to a repository. Split work
into phases when it crosses repositories, layers, or more than a few files,
and order phases so that contract-producing work lands before its consumers.

Each phase includes:

- **Status:** `pending` when written. The implementer changes it to `done`,
  or to `dropped: <reason>`. These are the only three values.
- **Goal, repository, files, changes, and logic.**
- **Side effects:** what else changes as a result. Check callers and call
  sites; public contracts and their consumers; data to migrate or backfill,
  including records that predate the change; config, feature flags,
  environment variables, and secrets; queues, permissions, and
  infrastructure; logs, metrics, and alerts; performance and cost; behaviour
  users or other teams will notice; required deploy order; documentation
  that describes the changed behaviour, such as READMEs, API docs,
  runbooks, config references, and changelogs. If there are none, write
  "None".
- **Dependencies, risks, and edge cases.**
- **Rollback,** where it is more than reverting the commit.
- **Verification,** with exact commands where known.
- **Suggested commit message.**

### Context for the implementer

Alongside the phases, record what an implementer would otherwise have to
rediscover:

- **Current behaviour.** Per repository: the controlling path, how the parts
  fit, how tests run.
- **Patterns to follow.** A path to an existing implementation of the same
  kind of change.
- **Traps.** Generated files that must be regenerated, slow or flaky tests,
  lint or analyser rules that reject the obvious approach, config that must
  change in step, services that must be running.
- **Out of scope.** What not to change, including nearby refactors.

State facts, and mark anything unverified as unverified.

### Architecture decision records

Leave this out if no repository in scope uses ADRs.

- **ADRs that apply.** List the accepted ADRs the change touches, with path
  and title, and how the plan follows each.
- **New ADRs.** If the change makes a decision of the kind the repository
  records, propose an ADR: for example a new dependency or service, a new
  pattern, a contract between services, how data is stored, or a
  cross-cutting concern. Give the repository, the next number, a title, and
  the context, decision, and consequences in a few lines. Use the
  repository's template, naming, and initial status, usually `Proposed`.
  Accepting it is the team's decision, in review.
- **Changes to existing ADRs.** If the change reverses or narrows an
  accepted ADR, propose a new ADR that supersedes it, and the status change
  on the old one. Do not rewrite the substance of an accepted ADR unless the
  repository's convention says to.
- Whether a decision is worth an ADR is a reversible question: decide it,
  and list it as a provisional decision.
- ADR work goes in a phase, with a `Status:` like any other, in the
  repository whose decision it records, so it is reviewed and shipped with
  the change.

### Coverage and done

Map each acceptance criterion to a phase and a verification step. Include
regression coverage for existing behaviour, and any migration, rollback, or
observability work. If a check cannot be identified, say what must be found
out rather than guessing a command. The definition of done requires the
relevant build, test, lint, format, synth, deployment, and smoke checks to
pass, or lists them as blocked.

## Write the plan file

Save Markdown to `.working-docs/<jira-key>.md` at the folder root (join
multiple keys with hyphens), creating the directory if needed. Write it
whether or not questions remain open.

The first line is exactly one of:

- `Plan status: ready to implement`
- `Plan status: blocked on Jira answers`

Then, omitting sections that do not apply: context and goal; repositories,
with path and branch, noting any that joined mid-plan or need no changes;
current behaviour; repository constraints; architecture decision records;
decisions; provisional decisions; open questions; phases; patterns to follow;
traps; out of scope; acceptance criteria coverage; verification; git
workflow; definition of done.

An implementer opening the file should learn what the change is, which
repositories it touches, and where to start reading before reaching any
phase detail.

### Git workflow section

- Record the existing feature branch.
- List the commits per repository: one per phase, with its suggested
  message. Nothing is committed until `jira-ship`, which makes them.
- Give a PR title and description for each repository that has phases,
  covering scope, rationale, testing, and rollout risks. Repositories whose
  phases were all dropped get none.
- End every PR title with the Jira key in parentheses:
  `Add retry to orders (#VFS-1234)`.
- State the landing order as a list of repositories, with which PR depends on
  which.
- Close with the next steps: review this plan and tell Sol to implement it;
  then, as the user types them, `/jira-review` for conformance to this
  plan, `/code-review` for correctness, and `/jira-ship`.

## Close the run

**If any question was deferred,** draft one comment for the story. All
deferred questions go in that single comment, numbered. Never post one
comment per question, and never post during the interview.

The comment contains:

1. A short paragraph: what is being planned, and in which repositories.
2. Decisions made, each with its reasoning, and any ADRs proposed.
3. Provisional decisions, each with the cost of changing it.
4. Open questions, numbered. For each: the context needed to answer it, the
   options considered, and what each outcome would change. Write them so
   that someone who was not in the session can answer without follow-up.
5. The plan file path and the feature branch.

Have the user approve the comment, as below, before anything is posted.
Then report the plan path, the branch, the open questions, and whether the
comment was posted, and stop. Do not implement or commit.

**If nothing is outstanding,** report that the plan is ready for review, with
its path, the repositories, and the branch, and stop. Implementation starts
when the user says so, usually after reviewing the plan.

### Approve the comment

Nothing goes to Jira until the user approves it, word for word. In yolo
mode nothing else prompts before a post, so this step is what prevents one.

1. Show the whole comment, exactly as it would be posted.
2. Ask whether to post it as it is, or what to change. With a question tool
   such as `ask_user`, the choices are **Post it** and **Don't post**, and
   the user types changes in the tool's free-text input. Without one, ask
   in plain text.
3. On changes, revise the comment, show all of it again, and ask again.
   Repeat until the user picks Post it or Don't post.
4. If a change answers a deferred question, record the answer in the plan
   as a decision and update the plan to match. In the comment, it moves
   from the open questions to the decisions. If no question is left open,
   post nothing, set the plan's first line to
   `Plan status: ready to implement`, and close as when nothing is
   outstanding.
5. On Post it, post the comment with `twg`, exactly as last shown. On Don't
   post, post nothing. The plan stays blocked, and its open questions are
   there for the user to take to the team another way.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. After writing the
file, give its path and a short summary. If the file cannot be written,
return the plan inline with its intended path.
