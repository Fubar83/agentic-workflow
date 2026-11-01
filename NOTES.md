# Speaker notes

Slot: 20 to 30 minutes, about 100 engineers. Allow roughly 6 to 8 minutes for
the demo (an estimate; time a run-through). Sections are numbered to match the
slide counter.

Text in `[brackets]` is for you to fill in. Everything else describes how the
setup works. The appendix at the end describes each agent and skill, for
questions afterwards.

---

## 1. Title

- What the talk covers: going from a Jira story to pull requests across
  several repositories, with an agent doing the implementation.
- `[Your opening, if you want a personal hook: for example, the part of this
  workflow you like most.]`

## 2. Chapter one: the loop

Transition. The next slides walk the loop; chapter two explains what makes it
work.

## 3. Seven steps, one pass

Read the steps in order. Do not explain them yet; this slide is the outline.

1. Feature folder: one worktree per repository.
2. The agent starts in that folder.
3. A plan is built from the Jira story.
4. I review the plan.
5. The agent implements it. Nothing is committed yet.
6. Review: `/jira-review` against the plan, then `/code-review` (my own
   skill).
7. Ship: `/jira-ship`.

Points to make:

- The plan review (step 4) is where I spend my attention.
- Shipping is one step: commits and pull requests in every repository.
- After each step, Sol offers the next one as a choice. For a small change
  it also offers to skip: implement without the plan review, or go
  straight to `/jira-ship`, which skips `/code-review` and runs
  `/jira-review` itself. The plan and the checks inside `/jira-ship` always
  run.

## 4. The plan step closes the gaps

The core of the talk. Give it time.

- The skill reads the story through `twg`, Atlassian's Teamwork Graph CLI, and
  the code in every repository in the folder. It writes one plan covering all
  of them.
- It sorts questions first. Reversible ones (naming, structure) it decides
  itself and records as provisional. Only blocking ones (schemas, contracts,
  ownership, security) come to me.
- It asks those before writing any phases: the whole list first, then one at
  a time. Each comes with the options it suggests and what each means, and
  "Defer to the team" last, which stops the run. I can also type my own
  answer.
- A free-text answer is recorded as a decision like the others. If it is
  unclear or conflicts with the code, the agent asks a follow-up.
- The plan is written so a fresh session can implement from it: side effects
  per phase, current behaviour, patterns to follow, traps, out of scope.
- Where a repository has ADRs, the plan follows the accepted ones, treats
  going against one as a blocking question, and proposes a new or
  superseding ADR when the change makes a decision worth recording.

## 5. Outstanding questions stop the run

- If any question is deferred, the agent posts one comment on the story: the
  decisions made, the provisional decisions, and the open questions with
  enough context to answer them. All deferred questions go in that one
  comment.
- It then saves the plan, marked blocked, and stops. No implementation.
- If nothing is deferred, the plan is marked ready and the run still stops,
  for my review. I can ask for changes, and implementation starts when I say
  so.
- When the story has answers, the next run reads the saved plan, keeps its
  decisions, and asks only what is still open.

## 6. Two reviews, then ship

- Nothing is committed before shipping, so both reviews look at local
  changes, and fixes end up in the same commits.
- The order matters. First: did we solve it the way the plan says? Then:
  does it have side effects, regressions, or bad code?
- `/jira-review` checks the change against the plan: every phase done or
  dropped with a reason, every acceptance criterion covered by a check that
  ran, nothing in the diff that the plan did not call for. It uses the plan
  rather than the story because the plan also holds the decisions from the
  interview.
- `/jira-review` also suggests changes to `AGENTS.md` and the other
  instruction files, from what the run learned: a command that turned out to
  be different, a convention found by trial. I decide which to take, and
  accepted ones get their own commit.
- `/code-review` then looks for side effects, regressions, and bad code: it
  compares the change in every repository with main, committed or not, new
  files included, and reads neither Jira nor the plan. It is my own skill,
  and I run it myself. I pick the findings to fix, by number.
- `/jira-ship` makes one commit per phase with the Jira key, opens pull
  requests in merge order, and cross-links them. The descriptions carry the
  decisions from the plan. It posts nothing to Jira. Pull request titles
  end with the key, for example `(#VFS-1234)`.
- `/jira-ship` runs `/jira-review` again first if anything changed since
  the last review, such as fixes from `/code-review`. It stops if the plan
  is blocked, a phase is unfinished, a repository has changes the plan does
  not account for, or the review does not conform. Run again later, it
  pushes to the same pull requests.
- Each skill can be typed, or Sol runs it when asked in plain words, such as
  "ship it".

## 7. From story to pull requests

The whole loop on one slide, now that each step has been explained. Follow
the thick line down, then point at the loops beside it. The left side of
the slide is the legend.

- The thick line is the run when all goes well, from the story to the pull
  requests.
- Gold boxes are where I decide: the plan review, and merging the pull
  requests.
- Questions deferred go to the team, on the story. When the team has
  answered, the next run continues from the saved plan.
- `/jira-review` comes first: did we build what we agreed? `Diverges` sends
  the change to Sol to fix, and then it is reviewed again.
- Then `/code-review`: side effects, regressions, bad code. Sol fixes the
  findings I pick.
- `/jira-ship` reviews against the plan again if the fixes changed
  anything, then commits and opens the pull requests.
- The dotted line: on a small change I can skip `/code-review`.
  `/jira-ship` still runs `/jira-review` and the verification.
- The chart is Mermaid, loaded from a CDN. Without a connection the slide
  shows the steps as one line of text.

## 8. Chapter two: what makes it work

Transition. Three things: one folder per change, one plan that every step
works from, and the agents.

## 9. One folder, every repo

- One folder per change, with a git worktree per repository, all on the same
  branch name. One command creates it, and the agent starts there with every
  repository in reach.
- The repositories on screen are real: `fsp-marketconfiguration-service`,
  `fsp-providerdata-service`, `fsp-integration-service`.
- Main checkouts are never worked on directly.
- If planning finds another repository that needs changes, its worktree is
  added. A repository that turns out to need no changes gets no commit and no
  pull request.
- Repositories that only need to be read are read from main; they do not get
  a worktree.
- I use my own tool, `wag`, to create the folder. `git worktree add` does the
  same by hand.

## 10. One plan, every step

- The plan is one Markdown file, `.working-docs/<jira-key>.md`, at the root
  of the feature folder. That is outside every repository, so it is never
  committed.
- The first line says whether it is ready or blocked. Each phase has a
  status: pending, done, or dropped with a reason. Sol updates them as work
  lands, so an interrupted run can pick up from the file.
- `/jira-review` checks the change against it. `/jira-ship` will not ship
  while a phase is pending, commits phase by phase, and adds the pull request
  links to it.
- Sol also keeps a Lessons section in it: anything that cost a retry and
  that a repository's instruction files would have prevented. That is where
  `/jira-review`'s suggestions come from.
- On screen, one repository turned out to need no change, so its phase is
  dropped and it gets no pull request.

## 11. Sol delegates, then integrates

- `cpyolo` is my alias: it starts Copilot CLI with the Sol agent selected, in
  yolo mode.
- Sol coordinates. Bounded work goes to Luna worker agents: a broad search,
  one repository's implementation slice, a verification run.
- Workers in different repositories cannot conflict, so Sol starts them
  together. Work that shares files or depends on order runs in sequence.
- `[Confirm in a test run that Sol starts the workers together; /tasks
  lists them. Copilot CLI runs subagents concurrently, but starting several
  at once is the model's choice; /fleet asks for it explicitly.]`
- Workers return only their results, which keeps Sol's context focused on the
  plan.
- Sol does not accept a worker's "done" as verification. It reruns the
  checks.

## 12. Chapter three: where it runs

Transition. The environment the agent runs in, which is what lets it work
without asking me before every command.

## 13. The container sets the limits

- The agent runs commands without asking me first. The container sets the
  limits, and my attention goes to the plan and the diff.
- The container:
  - No internet. Outbound traffic goes through a proxy with pre-approved
    domains only.
  - No AWS access. Read-only access to staging may come later.
  - One open port, for front-end dev servers.
  - Backends are run and debugged in Rider on the host.
- It is a small Linux box with VS Code integration, on rootless Podman over
  WSL 2. It is not a copy of the CI environment.
- On screen: commands run freely inside the box. Pushing happens only through
  `/jira-ship`.
- Be precise about that last point. The container can reach GitHub, because
  `/jira-ship` pushes from it, and in yolo mode nothing prompts before a
  push. What keeps pushes inside `/jira-ship` is the agents' instructions,
  not the sandbox.

If asked what happens when the agent does something destructive: it works in
a worktree, with no internet beyond approved domains and no cloud
credentials. It could push a branch; its instructions forbid that outside
`/jira-ship`. A deny rule for `git push` in the start command would enforce
it, at the cost of pushing by hand.

## 14. Demo

Before starting, say what to watch for:

- One folder spanning several repositories.
- The plan review.
- A question deferred to the team, and the run stopping.

`[Pick a story that spans at least two repositories, and decide in advance
whether you expect a deferred question.]`

If the plan comes back with no open questions, say so; that is a valid
outcome. If the demo runs long, skip slide 15.

## 15. What I like

- Setup: one folder and one command, with every repository in it.
- Questions: answered before any code is written, or handed to the team with
  enough context to answer them.
- Record: open questions go to the ticket with the decisions made so far, and
  the decisions travel with the pull requests when it ships.
- `[Say what you like most, in your own words. If you have measured
  anything, such as time from story to pull request, add the numbers.]`

Limits worth stating:

- The result depends on how well the story is written.
- Backend changes are verified by me, in Rider.
- Pushing and opening pull requests are always my decision.

## 16. Questions

On screen: the letters of FSP play pong. Each side has three score slots,
filled as that side scores, and the first to three wins. Then they line up
as FSP again and start over. It runs only while this slide is open, and
shows a still frame when the system asks for reduced motion.

Likely questions, with factual answers:

- **Can I use this?** The skills, `/code-review` included, and the agents
  are Markdown files. The folder pattern works with plain `git worktree`;
  `wag` is optional.
- **What about secrets and data?** The container has no internet access
  beyond approved domains and no cloud credentials. It can reach GitHub;
  pushing outside `/jira-ship` is ruled out by instruction, not by the box.
- **Does it work for small changes?** Yes. The plan's depth scales with the
  risk of the change.
- **How long did it take to set up?** `[Your answer.]`

---

## Appendix: agents and skills

Reference for questions, not a slide: what each one does, how, and why I
use it. The full version is `agentic-setup/AGENTS-AND-SKILLS.md`.

### Sol Orchestrator, the main agent

- **What:** started with `cpyolo` in the feature folder. It takes the story
  from plan to pull requests.
- **How:** works only from an approved plan, phase by phase, contracts
  before consumers. Hands bounded work to Luna workers, one per repository,
  in parallel where they cannot collide. Reruns the checks itself before
  calling anything done. Never commits outside `/jira-ship`. Ends every
  step by offering the next one.
- **Why:** one agent holds the whole change across repositories: the plan,
  the landing order, and the contracts. Delegating keeps its context on the
  plan and the integration.

### Luna Worker, the worker agent

- **What:** one bounded task in one repository: a search, a slice of files,
  a review, or a verification run. Only Sol starts it.
- **How:** stays in its assigned worktree, edits only the files it was
  given, leaves git and Jira alone, and does not delegate. Reports only the
  result: paths, commands run, and anything an instruction file would have
  saved it.
- **Why:** work runs in parallel per repository, and the reading stays out
  of Sol's context. The narrow boundaries make it safe to run several at
  once.

### `/jira-plan`

- **What:** one plan for every repository in the folder, after an
  interview. It stops without implementing.
- **How:** reads the story through `twg`, the code, the instruction files,
  and the ADRs. Decides reversible questions itself and lists them as
  provisional. Asks the blocking ones: the whole list first, then one at a
  time, with options, my own answer, or Defer to the team. Deferred
  questions go to the story in one comment, and the plan is marked blocked.
- **Why:** expensive questions are settled before any code is written. The
  plan carries everything a fresh session needs, and every later step is
  checked against it.

### `/jira-review`

- **What:** the first review after implementation. Is the change what the
  plan agreed? Verdict: `Conforms`, `Diverges`, or `Cannot tell`.
- **How:** every phase done or dropped with a reason, every acceptance
  criterion backed by a check that ran, no change the plan did not call
  for, decisions and contracts honoured. It runs the plan's checks itself
  and suggests instruction-file changes from the run's lessons.
- **Why:** the pull requests contain what was agreed and nothing more, and
  each run makes the next one better.

### `/code-review`

- **What:** my own review skill, after `/jira-review`. Is the code right?
- **How:** reviews every worktree against its base branch, committed or
  not, new files included. Follows callers and contract consumers across
  repositories. Reports numbered findings with evidence, and what it
  covered in each repository. Reads neither Jira nor the plan.
- **Why:** a change can follow the plan exactly and still break a caller or
  old data. Numbered findings let me pick what Sol fixes.

### `/jira-ship`

- **What:** commits, pushes, and opens the pull requests. Posts nothing to
  Jira.
- **How:** refuses a blocked or unfinished plan, and changes the plan does
  not account for. Reruns `/jira-review` and the verification if anything
  changed. One commit per phase, pull requests in landing order, dependents
  as drafts, cross-linked, with the plan's decisions in the descriptions.
- **Why:** shipping is one step and my decision, and what ships is what was
  planned, reviewed, and verified.

### `/jira-refine`

- **What:** prepares stories for a refinement session. No feature folder,
  plan, or estimate.
- **How:** reads each story against the code on main and posts one comment
  per story: questions, caveats, special cases, and likely reach.
- **Why:** refinement starts from concrete questions, and `/jira-plan`
  reads the answers later with the rest of the story.
