# Agents and skills

What each agent and skill in this setup does, how it does it, and why it is
part of the workflow. The agent and skill files are the source of truth:
this page describes what they instruct, and where the two differ, the files
win. To install and run them, see [README.md](README.md).

## At a glance

| Name | Kind | What it does |
| --- | --- | --- |
| Sol Orchestrator | Agent | Takes a story from plan to pull requests |
| Luna Worker | Agent | Does one bounded task in one repository, for Sol |
| `jira-plan` | Skill | Plans every repository's change, after an interview |
| `jira-review` | Skill | Checks that the change is what the plan agreed |
| `code-review` | Skill | Checks the code for regressions and side effects |
| `jira-ship` | Skill | Commits and opens pull requests |
| `jira-refine` | Skill | Posts questions on stories before refinement |

The agents carry the rules that hold throughout: where to work, what never
to do, and how to share the work. Sol runs the session and hands bounded
pieces to Luna workers. The skills are the steps, each with a clear start
and end. A skill typed with `/` is loaded into the agent you are talking
to, usually Sol, so Sol's rules still apply while it runs. Sol also runs a
skill when asked in plain words, such as "plan VFS-1234" or "ship it".

## The loop

```
wag              feature folder: one worktree per repository, and FEATURE.md
cpyolo           Sol starts in the feature folder
/jira-plan       one plan across all repositories, after an interview
plan review      you read the plan, then tell Sol to implement
implement        Sol, with Luna workers; nothing is committed yet
/jira-review     is the change what the plan agreed
/code-review     is the code correct, in every repository
/jira-ship       a commit per phase, pull requests in landing order
```

The reviews run in that order. `/jira-review` first settles that the
change is the one that was agreed; `/code-review` then looks for what a
plan cannot foresee: side effects, regressions, and risky code.

At the end of each step, Sol offers the next one as a choice. A ready plan
can go to implementation straight away, and for a small change Sol also
offers to go straight to `/jira-ship`, skipping `/code-review`. The plan,
and the review and verification inside `jira-ship`, always run.

`/jira-refine` is not part of the loop. It runs on stories before a
refinement session and needs no feature folder.

## What they share

These hold for every agent and skill, so the sections further down do not
repeat them.

### One feature folder per change

A feature folder holds a git worktree per repository, all on the same
feature branch. `wag` creates it (`git worktree add` does the same by
hand), and its start profile runs `wag/feature-manifest.sh`, which writes
`FEATURE.md` at the folder root: the feature, branch, Jira key, and
repositories. Sol and every skill except `jira-refine` read it first.

The folder itself is not a git repository, so Copilot does not load the
repositories' instruction files. Sol, Luna, `jira-plan`, and `code-review`
read them for each repository themselves: `AGENTS.md`, `CLAUDE.md`,
`.github/copilot-instructions.md`, and the `.github/instructions/` files
that apply.

**Why.** Every repository the change touches is in one place, in reach of
one session. No agent needs to be told which story or repositories are in
scope, and main checkouts are never worked on.

### Reading other repositories

Every file change stays inside the feature folder. Other repositories,
such as shared libraries or contracts owned by another team, can be read,
but only from their main checkout in the projects folder, never from
another feature folder or task worktree. When a main checkout is on another
branch or has local changes, the agents read
`git -C <path> show origin/main:<file>` instead.

**Why.** Plans and reviews rest on what is merged; another feature folder
holds work that may never land. A repository that is only read needs no
worktree.

### The plan file

The plan is one Markdown file, `.working-docs/<KEY>.md` at the folder
root. It is outside every repository, so it is never committed.

- The first line is `Plan status: ready to implement` or
  `Plan status: blocked on Jira answers`.
- Each phase has a `Status:` of `pending`, `done`, or `dropped: <reason>`.
- A `Lessons` section collects anything that cost a retry and that an
  instruction file would have prevented.

`jira-plan` writes it. Sol implements from it and keeps it current: phase
status, corrections, the review fixes you pick, and lessons. `jira-review`
checks the change against it, and `jira-ship` commits phase by phase from
it and adds the pull request links.

**Why.** Every step works from the same agreed plan. An interrupted run
resumes from the file, and a fresh session can implement from it.

### Nothing is committed until shipping

Sol and Luna never commit. The change stays uncommitted in each worktree
through both reviews, and `jira-ship` commits it, one commit per phase.

**Why.** Both reviews look at the change as local edits, fixes from review
land in the same commits as the work they fix, and each branch's history
follows the plan's phases.

### Pushing and posting

Only `jira-ship` commits, pushes, and opens pull requests. Only `jira-plan`
and `jira-refine` write to Jira, each with at most one comment per story
per run, shown before it is posted; `jira-ship` writes nothing there.
Merging is always yours, and no skill changes a story's status.

**Why.** Sol runs in yolo mode, so nothing prompts before a command, a push
included. These rules keep pushes and Jira comments inside the steps you
start. They are instructions, not a sandbox: the container can reach
GitHub. A deny rule for `git push` in the start command would enforce the
push rule, at the cost of pushing by hand.

### The container

Sol and Luna run in a devcontainer with no direct internet (a proxy allows
approved domains only), no AWS credentials, and one open port, for
front-end dev servers. Backends are run and debugged in Rider on the host.
The agents treat these limits as constraints: they report a blocked
domain, never look for credentials, and never start a backend. A check
that needs a running backend is your step, and is reported as not run.

**Why.** The container sets the limits, so the agent can run commands
without asking, and your attention goes to the plan and the diff.

## Agents

Agent files are installed in `~/.copilot/agents/`.

### Sol Orchestrator

`agents/sol-orchestrator.agent.md`, on the `gpt-6.1-sol` model. You start
it from the feature folder with `cpyolo`, an alias for
`copilot --agent sol-orchestrator --yolo`.

**What it does.** Sol owns the change from plan to pull requests. It works
from the approved plan, implements the smallest coherent change across the
repositories, hands bounded work to Luna workers, integrates and verifies
what they return, and ends each step by offering the next one.

**How it does it.**

- **Starts from the folder.** It reads `FEATURE.md`, checks each
  repository's branch and working tree against it, and reads a repository's
  instruction files before working in it. It never creates or removes
  worktrees or branches, never edits a main checkout or another feature's
  worktree, and never touches work that is not its own. If the work needs a
  repository that is not in the folder, it asks for its worktree.
- **Works from the plan.** Without a plan, it runs `jira-plan` and stops
  where that stops. A blocked plan is never implemented. A ready plan means
  no questions are open, not that you have approved it, so Sol implements
  when you say so, or straight away if you asked it to plan and implement
  and the plan comes out ready. It follows the phases in order, so
  contracts land before their consumers, and treats each phase's side
  effects, traps, and out-of-scope notes as part of the work.
- **Keeps the plan current.** A phase becomes `done` when its checks pass,
  or `dropped` with the reason. Where the code contradicts the plan, Sol
  records the correction and continues from it. Anything that cost a retry
  that an instruction file would have prevented goes in `Lessons`.
- **Delegates by default.** Anything bounded enough to brief in a few lines
  goes to a Luna worker: a broad search, one repository's slice, test
  design, a verification run, a second opinion on a diff. Each brief gives
  the goal, the repository and worktree, the paths, whether the worker may
  edit and which files, what to return, and what is out of scope. Sol keeps
  the critical reasoning, the integration, and the final diff review.
- **Parallelises by repository.** Workers in different repositories cannot
  conflict, so independent work runs together. Work that shares files,
  depends on another phase, or touches a contract still being changed runs
  in sequence.
- **Verifies for itself.** A worker reporting success is not verification.
  Sol reruns the checks that matter, verifies both sides of a contract
  together, and runs each repository's tests, type checks, builds, and
  format and lint checks. Pre-existing failures are reported separately.
- **Hands over for review.** Sol does not commit. It fixes each
  `jira-review` finding or records why not, applies only the
  instruction-file suggestions you accept, each as its own phase, and fixes
  the `/code-review` findings you pick, recording each fix in the plan.
- **Offers the next step.** Each step ends with the next one, based on the
  step just finished, as a choice in Copilot's `ask_user` prompt: the
  recommended step, then any shorter routes, then Stop here. Shorter routes
  are offered for a small change: one repository and a few files, with no
  contract, schema, migration, or permission. Sol never skips a step on its
  own. When you ask it to skip one, it does, whatever the size of the
  change, except the plan and the checks inside `jira-ship`.
- **Reports** in a fixed order: summary, what changed in each repository,
  verification with anything unverified, remaining risks and blockers, and
  the next step.

**Why we use it.**

- One agent holds the whole change across repositories: the plan, the
  order things land in, and the contracts between them.
- Its rules apply to every skill run in its session, since a typed skill
  loads into Sol.
- Delegating keeps Sol's context on the plan and the integration; the wide
  reading happens in the workers.
- Independent work in different repositories runs at the same time.
- Checks are rerun before anything is reported as done, and a check that
  could not run is reported as not run.
- The next-step choice keeps the loop in order without anyone having to
  remember it, and leaves the shortcuts for small changes to you.

### Luna Worker

`agents/luna-worker.agent.md`, on the `gpt-6-luna` model, with the `read`,
`search`, `execute`, and `edit` tools. Only Sol starts it
(`user-invocable: false`).

**What it does.** A Luna worker does one bounded task in one assigned
repository: it investigates a question, implements an assigned slice of
files, reviews a change, or runs targeted verification. It returns its
findings and evidence to Sol and takes no ownership of the overall task.

**How it does it.**

- **Stays in its assignment.** It works only in the repository and worktree
  it was given, and checks its directory, branch, and working tree first.
  If the assignment is unclear, or it finds itself on `main`, it stops and
  reports.
- **Edits only when allowed.** An assignment is read-only unless it says
  otherwise, and a worker never edits files assigned to another. Before
  editing, it reads the repository's instruction files, then makes only the
  assigned changes and runs focused checks on its slice.
- **Reads widely, writes narrowly.** It may read the other worktrees in the
  folder and, outside the folder, main checkouts only. It writes only in its
  own worktree.
- **Leaves git and Jira alone.** It does not stage, commit, push, reset, or
  discard, and it changes no external system.
- **Does not delegate.** Its tool list leaves out `agent`, and its
  instructions rule it out.
- **Reviews from evidence.** For a review or a verification run, it
  inspects the actual change, puts concrete regressions and missing
  coverage first, and separates what it observed from what it infers.
- **Reports only the result.** Sol sees the report, not what the worker
  read. It leads with the result; gives exact paths, symbols, and line
  numbers; lists the instruction files read, files changed, and commands
  run with their results; flags anything that affects another repository
  or contradicts the plan; and notes anything an instruction file would
  have saved it, which Sol adds to `Lessons`.

**Why we use it.**

- Bounded work runs in parallel, one worker per repository, while Sol keeps
  the overview.
- The reading stays in the worker; Sol gets a short report it can act on.
- One repository, assigned files, and no git or Jira: those boundaries are
  what make parallel work safe.
- Its notes on missing instructions feed `Lessons`, and through
  `jira-review`, the repositories' instruction files.

## Skills

Skill folders are installed in `~/.copilot/skills/<name>/`. Each skill can
be typed with `/`, or Sol runs it when asked in plain words. Run in a
session without Sol, a skill still does its step and names the next one,
but nothing offers that step as a choice or runs it.

### jira-plan

`skills/jira-plan/SKILL.md`. Typed as `/jira-plan VFS-1234`, or run by Sol
when there is no plan.

**What it does.** Builds one implementation plan for a Jira story across
every repository in the feature folder, after interviewing you on the
questions that block it. It writes the plan and stops; it never
implements. It makes at most three writes: the plan file, the `jira:` field
in `FEATURE.md` if that is empty, and one Jira comment if a question is
deferred.

**How it does it.**

- **Reads before it asks.** The story through `twg`, Atlassian's Teamwork
  Graph CLI, with acceptance criteria, linked issues, and comments. Each
  repository's conventions and instruction files. The architecture decision
  records (ADRs) that touch the area; an accepted ADR binds the plan. The
  controlling code path, tests, callers, contracts, and commands. Contracts
  between repositories come first, because they decide the order the work
  lands in.
- **Sorts the questions.** A reversible question, where a wrong answer
  costs an edit later, such as naming or where a helper lives, it decides
  itself and records as a provisional decision, with the default and the
  cost of changing it. A blocking question, where a wrong answer is
  expensive or cannot be undone, comes to you: schemas and migrations,
  contracts between repositories or teams, ownership, security and
  permissions, behaviour others can observe, and any departure from an
  accepted ADR. When unsure, it treats a question as blocking.
- **Interviews you.** It lists every blocking question first, then asks
  them one at a time. Each comes with suggested options and what each means
  for the implementation, then Defer to the team, last, which stops the run
  once the interview is over. You can type your own answer instead; it is
  recorded as a decision like the others, after a follow-up if it is
  unclear or conflicts with the code.
- **Writes for someone who was not there.** The reader is an implementer
  with only the plan and the repositories, possibly days later. Depth
  matches risk, so a one-file change gets a short plan. Steps name the
  file, the symbol, and the change. Each phase has a status, its files and
  changes, side effects (callers, contracts, data, config, permissions,
  alerts, deploy order, documentation), risks, rollback where needed,
  verification commands, and a suggested commit message. Around the phases:
  current behaviour, patterns to follow, traps, what is out of scope, the
  ADRs that apply or are proposed, each acceptance criterion mapped to a
  phase and a check, a pull request title and description per repository,
  and the landing order.
- **Stops either way.** If anything was deferred, it posts one comment on
  the story with the decisions, the provisional decisions, and the open
  questions, each with enough context to answer it without follow-up, marks
  the plan blocked, and stops. Otherwise it marks the plan ready and stops
  for your review.
- **Resumes.** Run again, it builds on the saved plan, keeps its decisions,
  re-reads the story for answers, and asks only what is still open. On a
  ready plan, it applies the changes you ask for and keeps the rest.
- **Gives no estimates** of time, effort, or duration.

**Why we use it.**

- Questions are settled before code is written. Those that are expensive to
  get wrong come to you or the team; the cheap ones do not interrupt.
- One plan across repositories settles the contracts and the landing order
  before any repository changes.
- The plan keeps what investigation found, so a fresh session can implement
  from it and an interrupted run can pick up from the file.
- Deferred questions reach the team in one comment that can be answered
  without follow-up, and the next run picks the answers up from the story.
- Provisional decisions are shown too, in the pull request descriptions and
  in this comment when there is one, so the team can object without being
  asked to decide.
- Every later step is checked against the plan, so the plan review is where
  your attention goes.

### jira-review

`skills/jira-review/SKILL.md`. Typed as `/jira-review` after
implementation. `jira-ship` also runs it when it has not run since the last
change, such as after fixes from `/code-review`.

**What it does.** Checks the implemented change against the plan and gives
one verdict: `Conforms`, `Diverges`, or `Cannot tell`. It also suggests
changes to the repositories' instruction files from what the run learned.
It is read-only, and complements `code-review` rather than replacing it.

**How it does it.**

- **Reviews against the plan.** It reads `FEATURE.md` and the plan, then
  the whole change in each repository against its base: commits,
  uncommitted changes, and new files. Without a plan it stops; it does not
  fall back to a general review.
- **Runs eight checks.**
  1. **Phases:** each is `done`, or `dropped` with a reason.
  2. **Acceptance criteria:** each traces to code and to a check that ran.
     A claim alone is not coverage.
  3. **Scope:** every change traces to a phase. Unplanned changes are
     findings, improvements included.
  4. **Side effects:** each one the plan lists was handled.
  5. **Decisions:** the code follows the decisions in the plan and the
     accepted ADRs, and any proposed ADRs are in the diff.
  6. **Contracts:** where repositories meet, both sides match, and the
     landing order still holds.
  7. **Verification:** it runs the plan's checks itself, and separates
     what it observed from what it infers.
  8. **Plan accuracy:** any departure from the plan is recorded in it.
- **Accepts planned empty diffs.** A repository with no changes is fine
  when all its phases are `done` or `dropped`, and a finding when one is
  still `pending`.
- **Suggests instruction-file changes.** From the plan's `Lessons` and
  traps, and from what it saw running the checks, it proposes exact wording
  for `AGENTS.md` and the other instruction files: only what would have
  changed what the agent did on this run, kept short. Suggestions do not
  affect the verdict. You pick the ones to accept, and each becomes its own
  phase, and so its own commit.
- **Reports** the verdict, then the findings with repository, file and
  line, the plan item concerned, and what would resolve it, then what it
  ran and could not run. It closes with the next step, `/code-review` on
  `Conforms`, except when `jira-ship` runs it.

**Why we use it.**

- It runs first, so the code review that follows starts from a change
  known to be what was agreed.
- It checks against the plan rather than the story, because the plan also
  holds the decisions from the interview.
- The pull requests carry the agreed change and nothing else. Anything
  extra shows up before it ships.
- An acceptance criterion counts as covered only when a check that ran
  supports it.
- Each run improves the next: lessons become instruction-file changes,
  which later sessions read.
- `jira-ship` depends on it, and ships only on `Conforms`.

### code-review

`skills/code-review/SKILL.md`. Typed as `/code-review` after
`/jira-review`, or picked from Sol's next-step choice.

**What it does.** Reviews the change for regressions and must-fix issues in
every repository in the feature folder, against each one's base branch,
uncommitted and new untracked files included. It asks whether the code is
correct. It is read-only and reads neither Jira nor the plan.

**How it does it.**

- **Covers every worktree.** All of them are reviewed, including any
  expected to be unchanged; the folder root is not. A pull request, branch,
  commit, path, or base you name takes precedence, and outside a feature
  folder it reviews the repository it is in.
- **Compares with the real base.** The base is the pull request's base
  branch if there is one, otherwise the remote's default branch, never an
  assumed `origin/main`. `git diff <merge-base>` shows commits, staged, and
  unstaged changes together. New files, which `git diff` does not show,
  come from `git ls-files --others --exclude-standard` and are read in
  full. It never fetches, checks out, or stashes.
- **Follows the impact.** It reads each repository's instruction files,
  follows call sites, tests, schemas, and config until the impact is clear,
  and where a contract changes, reads its consumers in the other worktrees
  and in main checkouts. Wide reading can go to Luna workers, but the
  review reads the diffs itself and confirms in the code what a worker
  reports.
- **Checks five areas.** Behaviour and contracts; data and rollout,
  including which repository must deploy first; security; performance and
  reliability; tests and design. Focused checks run where they can confirm
  or rule out a suspected failure. A check that needs a running backend is
  listed as a gap.
- **Reports evidence only.** A finding needs a plausible failure, real
  impact, and concrete evidence. No style nits, praise, or speculation.
- **Numbers the findings.** By severity, Critical to Low, each with the
  repository, file, and line, the breaking scenario, whether it is
  demonstrated or needs confirmation, and the smallest fix. Then open
  questions, coverage per repository (the base, and the changed and new
  files), and what the review did not cover. It closes with the next step:
  tell Sol which findings to fix, by number, then run `/jira-ship`.

**Why we use it.**

- Correctness gets its own review, independent of the plan: a change can
  follow the plan exactly and still break a caller, a consumer, or old
  data. That is also why it comes after `jira-review`: it looks for what a
  plan cannot foresee.
- It reviews the change as it will ship, uncommitted and with its new
  files, because nothing is committed until `jira-ship`.
- Reading consumers across repositories, and asking which side deploys
  first, catches contract breaks between repositories.
- Numbered findings make fixing a choice. You name the numbers; Sol fixes
  them and records each fix in the plan, and `jira-ship` checks the fixes
  against the plan again before it commits.
- The coverage section shows exactly what was reviewed, so a clean result
  is clear about what it covers.

### jira-ship

`skills/jira-ship/SKILL.md`. Typed as `/jira-ship`, or run by Sol when you
ask it to ship.

**What it does.** Turns an implemented, reviewed plan into commits, pushes,
and pull requests. Running it authorises committing, pushing, and opening
pull requests, but not merging or deleting branches. It writes nothing to
Jira.

**How it does it.**

- **Checks before it touches anything.** It stops, changing nothing, if the
  plan is not ready, a phase is still `pending` (unless you say to ship
  what exists), a repository is off the feature branch, or a repository has
  changes the plan does not account for. It runs `jira-review` if that has
  not run since the last change, such as after fixes from `/code-review`,
  and continues only on `Conforms`. It runs the plan's verification if that
  has not passed since the last change. Checks left to you, such as those
  that need a running backend, are listed as not run, in the report and in
  the pull request description.
- **Commits per phase.** One commit per phase, in phase order, staging only
  files the plan accounts for, new ones included. Phases that share a file
  share a commit, whose body names them. Every subject includes the Jira
  key. It follows the repository's commit conventions where it has them,
  otherwise the plan's messages. It never commits on `main`, amends or
  rebases pushed commits, or force-pushes.
- **Opens pull requests in landing order.** One per repository with
  commits, from the plan's title and description, with the title ending in
  the key, as in `Add retry to orders (#VFS-1234)`. Each description also
  lists the plan's decisions and provisional decisions for that repository.
  A pull request whose dependency has not merged opens as a draft that
  links it. Once all are open, each description lists the others and the
  merge order. A branch that already has an open pull request is pushed
  to, and its description updated. Without `gh` or other tooling, it prints
  the title and description to paste.
- **Records and reports.** It adds each pull request link to the plan,
  reports per repository, and closes with the next step: review and merge
  the pull requests in landing order, and after fixes from review, run
  `/jira-ship` again.

**Why we use it.**

- Shipping is one step, and it is yours: commits and pull requests in every
  repository, together, when you decide.
- Its preconditions mean that what ships is what was planned, reviewed,
  and verified.
- One commit per phase gives each branch a history that follows the plan.
- Landing order and drafts let a change across repositories merge in the
  order its contracts need.
- The decisions travel with the pull requests, where reviewers can see and
  question them.
- It can run again: fixes after review go to the same pull requests.

### jira-refine

`skills/jira-refine/SKILL.md`. Typed as `/jira-refine` with one or more
keys, before a refinement session. It needs no feature folder.

**What it does.** Prepares stories for refinement. It reads each story
against the code it would touch and posts one comment per story with the
questions that block implementation, the caveats, the special cases the
acceptance criteria miss, and the likely reach. It writes no plan and gives
no estimate.

**How it does it.**

- **Reads the story and the code.** The story through `twg`, with all its
  comments, since a question may already be asked or answered. The code
  from main checkouts only, never a feature folder.
- **Restates the story** in its own words. If it cannot, that is the first
  finding.
- **Finds what the story does not say.** The code that would change, its
  callers, contracts, and tests, and what the code implies that the story
  does not mention: behaviour that would change, data to migrate, flags or
  config that gate the area.
- **Looks for four things.** Blocking questions; caveats, such as backwards
  compatibility, data volume, or areas without tests; special cases, such
  as first-run states, repeated requests, partial failure, permissions, and
  records that predate the change; and which repositories and services the
  work likely touches.
- **Comments once per story.** Its understanding of the story, numbered
  questions with why each matters, caveats and special cases, likely reach,
  and one line on what code it read. It is written for someone who has not
  seen the code, in a neutral tone. An earlier refinement comment is
  extended or corrected rather than repeated.
- **Suggests an agenda.** With several stories, it ends with them ordered
  by how much discussion each needs. A story that is already clear is
  reported as clear, with what was checked.
- **Changes nothing else:** no files, branches, fields, transitions, or
  assignees.

**Why we use it.**

- Refinement starts from concrete questions grounded in the code, so the
  time goes to what changes the outcome.
- The team sees the reach and the caveats before sizing, with no estimate
  made for them.
- The comment stays on the story, so when it is scheduled, `jira-plan`
  reads it, and the answers, with the rest of the story.

## Who writes what

| | Code | Plan file | Git | Jira |
| --- | --- | --- | --- | --- |
| Sol | In the feature folder | Keeps it current | Through `jira-ship` | Through the skills |
| Luna | Assigned files | No | No | No |
| `jira-plan` | No | Writes it | No | One comment, if deferred |
| `jira-review` | No | No | No | No |
| `code-review` | No | No | No | No |
| `jira-ship` | No | Pull request links | Commits, push, pull requests | No |
| `jira-refine` | No | No | No | One comment per story |

`FEATURE.md` is written by `wag/feature-manifest.sh`; `jira-plan` only
fills in its `jira:` field when that is empty.

## See also

- [README.md](README.md): installing, starting Sol, skipping steps, known
  limits, and the first run checklist.
- [wag/README.md](wag/README.md): how `FEATURE.md` is written.
