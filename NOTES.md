# Speaker notes

Slot: 20 to 30 minutes, about 100 engineers. Allow roughly 6 to 8 minutes for
the demo (an estimate; time a run-through). Sections are numbered to match the
slide counter.

Text in `[brackets]` is for you to fill in. Everything else describes how the
setup works. The appendix at the end describes each agent and skill, for
questions afterwards.

The red thread is one story, VFS-1234, followed from the Jira ticket to the
pull requests. Slide 2 lists its seven steps, and the slides after it take
them in that order: the agents and skills that do the work, the plan and
its questions, Jira through `twg`, then testing, reviews, and shipping. The
example carries through: slide 5 defers the retry question, slide 6 posts
it, and when the team answers 1A, `providerdata` needs no change. Slide 8
puts it all on one chart.

---

## 1. Title

- What the talk covers: my agent, my skills, and `twg`, and how they take a
  Jira story to pull requests across several repositories.
- `[Your opening, if you want a personal hook: for example, the part of this
  workflow you like most.]`

## 2. Seven steps, story to pull requests

Read the steps in order, with the tool beside each. Do not explain them yet;
this slide is the outline, and the rest of the talk follows it.

1. Feature folder, made with `wag`: one worktree per repository. Sol starts
   there with `cpyolo`.
2. A plan is built from the Jira story: `/jira-plan`.
3. I review the plan.
4. Sol implements it, with Luna workers. Nothing is committed yet.
5. I test it by hand.
6. Review: `/jira-review` against the plan, then `/code-review` (my own
   skill).
7. Ship: `/jira-ship`.

Points to make:

- The plan review (step 3) is where I spend my attention.
- Shipping is one step: commits and pull requests in every repository.
- After each step, Sol offers the next one as a choice. For a small change
  it also offers to skip: implement without the plan review, or go
  straight to `/jira-ship`, which skips `/code-review` and runs
  `/jira-review` itself. The plan and the checks inside `/jira-ship` always
  run.

## 3. Sol decides, Luna helps

- The folder first: one per change, with a git worktree per repository, all
  on the same branch name. `wag`, my own tool, creates it; `git worktree add`
  does the same by hand. Main checkouts are never worked on directly.
- The repositories in the story are real: `fsp-marketconfiguration-service`,
  `fsp-providerdata-service`, `fsp-integration-service`.
- `cpyolo` is my alias: it starts Copilot CLI with the Sol agent selected, in
  yolo mode. Sol is the agent I talk to.
- Sol's job: it runs the skills, from `/jira-plan` to `/jira-ship`, when I
  type them or ask in plain words. It implements the approved plan phase by
  phase, keeps the plan current, fixes the review findings I pick, and
  offers the next step when one is done. It never commits outside
  `/jira-ship`.
- Sol decides what to hand off: anything bounded enough to brief in a few
  lines. It keeps the key reasoning, putting the pieces together, and the
  final look at the diff, and reruns the checks itself rather than trusting
  a worker's "done".
- Luna's job: one bounded task in one repository, and only when Sol starts
  it. A broad search, one repository's slice of the implementation, test
  design, a verification run, or an independent look at a diff. It edits
  only the files it was given, leaves git and Jira alone, and does not start
  workers of its own.
- Planning and the reviews are skills, not agents: Sol runs them, and may
  hand Luna the wide reading they need.
- Workers in different repositories cannot conflict, so Sol starts them
  together. Work that shares files or depends on order runs in sequence.
- `[Confirm in a test run that Sol starts the workers together; /tasks
  lists them. Copilot CLI runs subagents concurrently, but starting several
  at once is the model's choice; /fleet asks for it explicitly.]`
- Workers return only their results, which keeps Sol's context focused on the
  plan. Sol does not accept a worker's "done" as verification. It reruns the
  checks.
- It all runs in a container with no internet beyond approved domains and no
  cloud credentials, so the agent runs commands without asking me first.
  Pushing happens only through `/jira-ship`. That is the agents'
  instructions, not the sandbox: the container can reach GitHub.

## 4. Four skills for the flow

- Each step is a skill: a Markdown file that Copilot CLI loads when I type
  its name, or when Sol runs it. Top to bottom is the order a story meets
  them.
  - `/jira-plan` interviews me on the blocking questions, then plans every
    repository at once.
  - `/jira-review`, after implementing and testing: does the change match
    the plan?
  - `/code-review`, my own skill: side effects, regressions, bad code.
  - `/jira-ship` commits and opens the pull requests.
- `/jira-refine` is separate, not part of the flow from Jira to pull
  requests. Before a refinement session it reads a story against the code
  and posts the questions it finds, once I confirm them. It needs no
  feature folder.
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
- In the story, `providerdata` turns out to need no change once the team
  answers the retry question, so its phase is dropped and it gets no pull
  request. The next two slides show how that question was asked.

## 5. The plan step closes the gaps

The core of the talk. Give it time.

- The skill reads the story through `twg` and the code in every repository
  in the folder. It writes one plan covering all of them.
- It sorts questions first. Reversible ones (naming, structure) it decides
  itself and records as provisional. Only blocking ones (schemas, contracts,
  ownership, security) come to me.
- It asks those before writing any phases: the whole list first, then one at
  a time. Each comes with the options it suggests and what each means, and
  "Defer to the team" last, which stops the run. I can also type my own
  answer.
- On screen: the first of two questions, which service owns the retry. A
  and B are the options it suggests, C is my own answer, and D defers it to
  the team. Here I pick D, and the next slide shows where it goes.
- A free-text answer is recorded as a decision like the others. If it is
  unclear or conflicts with the code, the agent asks a follow-up.
- The plan is written so a fresh session can implement from it: side effects
  per phase, current behaviour, patterns to follow, traps, out of scope.
- Where a repository has ADRs, the plan follows the accepted ones, treats
  going against one as a blocking question, and proposes a new or
  superseding ADR when the change makes a decision worth recording.

## 6. Jira, through twg

- `twg` is Atlassian's Teamwork Graph CLI, still in beta. The skills use it
  for everything in Jira: `twg jira workitem get` reads a story, and
  `twg jira workitem comment create` posts a comment.
- `/jira-plan` and `/jira-refine` read the whole story through it:
  description, acceptance criteria, linked issues, and comments, since a
  question may already be answered there.
- If any question is deferred, `/jira-plan` drafts one comment for the
  story, with all the deferred questions in it. On screen, question 1 is
  the one I deferred on the last slide.
- It is written to be read quickly: how many questions block the story,
  then each question with a line of context and its options lettered, so
  the team can answer "1A". The decisions come after.
- I see the comment before it is posted. I can type changes, and it shows
  me the new version, until it says what I want. Nothing goes to Jira
  until I confirm with Post it; the last line on screen is that choice.
- The plan is saved, marked blocked, and the run stops. No implementation.
- If nothing is deferred, the plan is marked ready and the run still stops,
  for my review. I can ask for changes, and implementation starts when I say
  so.
- When the story has answers, the next run reads the saved plan, keeps its
  decisions, and asks only what is still open. Here the team answers 1A,
  so the retry stays in `integration` and `providerdata` needs no change.
- `/jira-refine` posts the same way: one comment per story, confirmed first.
  `/jira-ship` writes nothing to Jira.

## 7. Test, review, then ship

- First I test by hand: backends in Rider, front ends on the dev server
  port. Sol does not start backends itself, so this step is mine. Bugs go
  back to Sol.
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

## 8. From story to pull requests

The whole loop on one slide, now that each part has been explained. Follow
the thick line down, then point at the loops beside it. The left side of
the slide is the legend.

- The thick line is the run when all goes well, from the story to the pull
  requests.
- Gold boxes are where I step in: answering the plan's questions, the plan
  review, testing by hand, picking the fixes from `/code-review`, and
  merging the pull requests.
- The plan review, with the heavy frame, is where most of my work goes. It
  is a loop, not a gate: Sol makes the changes I ask for in the plan and
  records each as a decision, and I review it again until I approve. For
  a bigger rethink I run `/jira-plan` again, which revises the plan and
  keeps what was decided.
- Questions I defer go to the team in a comment I confirm. When the team
  has answered, the next run continues from the saved plan.
- After implementing, I test by hand: backends in Rider, front ends on the
  dev server port. Sol does not start backends itself, so this is my step.
  Bugs go back to implementation.
- `/jira-review` comes first: did we build what we agreed? If something is
  missing, it goes back to implementation, and the change is reviewed again.
- Then `/code-review`: side effects, regressions, bad code. If it has
  comments, I pick the ones to fix and tell the agent to fix them. "again":
  I can run `/code-review` a second time on the fixes. With no comments,
  it goes straight to `/jira-ship`.
- `/jira-ship` reviews against the plan again if the fixes changed
  anything, then commits and opens the pull requests.
- The dotted line: on a small change I can skip `/code-review`.
  `/jira-ship` still runs `/jira-review` and the verification.
- The chart is Mermaid, loaded from a CDN. Without a connection the slide
  shows the steps as one line of text.

## 9. Demo

`RUN` behind the title is how you started a program on a C64.

Before starting, say what to watch for:

- One story, one folder spanning several repositories.
- The plan's questions, and the plan review.
- A question deferred to the team, posted with `twg` once I confirm it, and
  the run stopping.

`[Pick a story that spans at least two repositories, and decide in advance
whether you expect a deferred question.]`

If the plan comes back with no open questions, say so; that is a valid
outcome. If the demo runs long, skip slide 10.

## 10. What I like

- Setup: one folder and one command, with every repository in it.
- Questions: answered before any code is written, or handed to the team with
  enough context to answer them.
- Record: the plan's decisions travel with the pull requests when it
  ships, and deferred questions go to the ticket through `twg` with the
  decisions made so far.
- `[Say what you like most, in your own words. If you have measured
  anything, such as time from story to pull request, add the numbers.]`

Limits worth stating:

- The result depends on how well the story is written.
- Backend changes are verified by me, in Rider.
- Pushing and opening pull requests are always my decision.

## 11. Questions

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
  questions go to the story in one comment, each with lettered options.
  I see it and can change it before it is posted, and the plan is marked
  blocked.
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
- **How:** reads each story against the code on main and drafts one comment
  per story: questions, caveats, special cases, and likely reach. I see
  each one first, can change it, and choose whether it is posted.
- **Why:** refinement starts from concrete questions, and `/jira-plan`
  reads the answers later with the rest of the story.
