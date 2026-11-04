# Speaker notes

20 to 30 minutes, about 100 engineers; 6 to 8 of them for the demo. One
section per slide, numbered like the slide counter. Each bullet in bold is
the text on the slide; the line under it is the reminder of what to say.

The red thread is story VFS-1234, from the Jira ticket to the pull
requests. Slide 5 defers the retry question, slide 6 posts it, the team
answers 1A, and `providerdata` needs no change.

---

## 1. My agentic workflow

- **My agentic workflow**
  - My agent, my skills and `twg`, on GitHub Copilot CLI.
- **From Jira to pull requests**
  - One story, several repos, start to finish.
- `[Your opening hook, if you want one.]`

## 2. Seven steps, story to pull requests

The outline. Name each step; the rest of the talk explains them in order.

- **Feature folder** `wag` `cpyolo`
  - A worktree per repo, same branch. Sol starts there.
- **Plan from the story** `/jira-plan`
  - Reads Jira and the code, asks me, writes the plan.
- **Review the plan**
  - Where most of my time goes.
- **Implement**
  - Sol and Luna, phase by phase. Nothing is committed yet.
- **Test by hand**
  - Rider and the dev server. My step.
- **Review** `/jira-review` `/code-review`
  - The plan first, then the code.
- **Ship** `/jira-ship`
  - Commits and pull requests in every repo, in one step.

## 3. Sol decides, Luna helps

Sol · the orchestrator

- **Runs the skills and implements**
  - The agent I talk to. `cpyolo` starts it in yolo mode.
- **Decides what to hand to Luna**
  - Bounded work it can brief in a few lines.
- **Supervises Luna, checks everything**
  - Reruns the checks itself; a worker's "done" is not enough.

Luna · the worker

- **One task, in one repo**
  - Only Sol starts it. Workers in different repos run in parallel.
- **Searches, writes code, runs tests**
  - Only the files it was given. No git, no Jira.
- **Reports back to Sol**
  - Results only, so Sol's context stays on the plan.

If asked: it runs in a container with no internet beyond approved domains,
which is why yolo mode is fine. Pushing happens only in `/jira-ship`.

## 4. Four skills for the flow

Each skill is a Markdown file. I type its name, or ask Sol in plain words.

- **`/jira-plan`** Interrogates me, then writes one plan for every repo
  - Blocking questions only, before any code. One plan across the repos.
- **`/jira-review`** After implementing: is it what the plan says?
  - Every phase done, every acceptance criterion checked, nothing extra.
- **`/code-review`** Then: is the code right?
  - My own skill: side effects, regressions, bad code.
- **`/jira-ship`** Commits and opens the pull requests
  - A commit per phase, pull requests in merge order.
- **The plan they share** `.working-docs/VFS-1234.md`
  - Outside every repo, never committed. Ready or blocked; a status per
    phase, so an interrupted run picks up from it.
- **Separate, not part of the flow** `/jira-refine`
  - Before refinement: reads a story against the code and posts its
    questions once I confirm. No feature folder, no plan.

## 5. The plan step closes the gaps

The core of the talk. Take your time.

- **Only blocking questions are asked**
  - Schemas, contracts, ownership, security. The whole list, then one at a
    time.
- **Reversible ones are decided and listed**
  - Naming, structure. Marked provisional, easy to change in review.
- **Every answer goes in the plan**
  - Detailed enough that a fresh session could implement from it.
- **On screen:** question 1 of 2
  - A and B are its suggestions, C my own answer, D defers to the team.
  - I pick D. The next slide shows where it goes.

## 6. Jira, through twg

- **`twg jira workitem get VFS-1234`**
  - Atlassian's Teamwork Graph CLI, in beta. All Jira access goes through
    it.
- **Reads the story and its comments**
  - Description, acceptance criteria, links. An answer may already be
    there.
- **Deferred questions go back in one comment**
  - Lettered options, so the team can answer "1A". The plan is saved as
    blocked and the run stops.
- **Posted only when I confirm**
  - I see the exact text and can change it. Then Post it or Don't post.
- **On screen:** the comment on VFS-1234
  - Question 1 is the one deferred on the last slide.
  - The team answers 1A: the retry stays in `integration`, and
    `providerdata` is dropped. The next run asks only what is still open.

## 7. Test, review, then ship

Nothing is committed before shipping, so fixes land in the same commits.

- **Does it work?** By hand, in Rider and the dev server
  - Sol does not start backends, so this is mine. Bugs go back to Sol.
- **Is it what we agreed?** `/jira-review`, against the plan
  - Phases, acceptance criteria, nothing extra. Also suggests changes to
    `AGENTS.md` from what the run learned.
- **Is the code right?** `/code-review`, against main
  - Every repo, committed or not. Numbered findings; I pick the fixes.
- **Ship it** `/jira-ship`: a commit per phase, pull requests in order
  - Reruns `/jira-review` if the code changed. Decisions go in the pull
    request descriptions; nothing goes to Jira.

## 8. From story to pull requests

The happy path, straight down. The ways back are for telling, not drawing.

- **Gold: where I step in**
  - Answer, plan review, test by hand, merge.
  - The plan review has the heavy frame: most of my work. A loop: Sol
    changes the plan until I approve it.
- If asked, the ways back:
  - Deferred questions go to the team; the answers go to `/jira-plan`.
  - Bugs and missing work go back to Implement.
  - `/code-review` comments: I pick the fixes, and it can run again.
  - A small change can skip `/code-review`.

## 9. Demo

`RUN` behind the title is how you started a program on a C64.

- **One story, several repos**
  - One feature folder, `cpyolo`, then `/jira-plan`.
- **The plan and its questions**
  - Answer some, defer one, then the plan review.
- **A question posted with twg**
  - Show the comment, confirm it, and the run stops.
- `[Pick a story that spans at least two repos.]` No open questions is a
  valid outcome too. If it runs long, skip slide 10.

## 10. What I like

- **Yolo mode:** No prompts to approve. Sol just gets on with it.
  - Safe because it runs in a container, and pushing only happens in
    `/jira-ship`.
- **One plan:** Straight from the Jira story, for the whole task.
  - One file covers every repo, and every later step checks against it.
- **In parallel:** Several Jira stories at once, a feature folder each.
  - Own worktrees, own plan, own Sol. While one waits on the team or on
    me, another moves on.
- Limits: it depends on how well the story is written; backend checks are
  mine; pushing is always my decision.

## 11. Questions?

- **Ready.** and the pong screen
  - The letters of FSP play pong, first to three, then start over.
- Likely questions:
  - **Can I use this?** The agents and skills are Markdown files. Plain
    `git worktree` works instead of `wag`.
  - **Secrets and data?** No internet beyond approved domains, no cloud
    credentials. Pushing only in `/jira-ship`, by instruction.
  - **Small changes?** Yes. The plan's depth scales with the risk.
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
