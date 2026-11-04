# Speaker notes

20 to 30 minutes, about 100 engineers; 6 to 8 of them for the demo. One
section per slide, numbered like the slide counter. Each bullet in bold is
the text on the slide; the line under it is the reminder of what to say.

The red thread is story VFS-1234, from the Jira ticket to the pull
requests.

---

## 1. My agentic workflow

- **My agentic workflow**
  - My agent, my skills and `twg`, on GitHub Copilot CLI.
- **From Jira to pull requests**
  - One story, several repos, start to finish.

Why I built it:

- **Sandboxing came first**
  - We started running the agent in devcontainers, behind a Squid proxy.
  - Next I wanted to stop moving data between Jira and the agent by hand.
- **Then I found `twg`**
  - A CLI that talks to Jira and Confluence. It got me thinking: how can
    this tool make my job more efficient?
- **What `twg` gives me**
  - No copy-pasting from the story, and no writing my own description of
    the task and missing things.
  - The agent reads the whole story, comments included, so it gets the
    acceptance criteria and everything else.
- **What sandboxing gives me**
  - It is safe to run in yolo mode, so I babysit the agent less.
- **The flow I wanted**
  - Focus on the task for a while, then go and do other things while the
    agent does its part.

## 2. Sandboxing

Where it started. This is what makes the rest possible.

- **Runs in a devcontainer**
  - The agent, the repos and the tools live in the container, not on my
    machine.
- **Internet only through a Squid proxy**
  - Only approved domains get through: GitHub, Jira, Copilot.
- **No cloud credentials inside**
  - Nothing in the container can reach our cloud accounts.
- **So yolo mode is fine**
  - No prompts to approve, so I babysit the agent less. Pushing happens
    only in `/jira-ship`, by instruction.
- **On screen:** the container, the proxy, and what is allowed out

## 3. twg, the Atlassian CLI

The next step after the sandbox: stop moving data between Atlassian and
the agent by hand.

- **One CLI for Jira and Confluence**
  - The Teamwork Graph CLI, still in beta. When I found it, I started
    thinking about how it could make my job more efficient.
- **The agent reads and writes them itself**
  - Jira: the whole story, with acceptance criteria, links and comments.
  - Confluence: we use it to keep our architecture pages up to date.
- **No copy-paste, nothing missed**
  - No pasting from the story, and no writing my own description of the
    task.
- **On screen:** the two Jira commands the skills use, and Confluence
  - One reads a story, one posts a comment. A comment is posted only
    once I have seen it and confirmed it.

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

## 5. Story to PR

The outline. Name each step; the rest of the talk explains them in order.
I wanted clear steps: where I am needed, and where I am not.

- **Scope work**
  - Sets up the folder structure, and a worktree per repo, with the same
    branch name in all of them. The folder records the Jira ID.
  - Custom tools are easy to make, so I made `wag` to fit my way of
    working. It does all of this.
  - `cpyolo` is my alias: it starts Copilot in yolo mode with my
    preferred agent, Sol.
- **Plan from the story** `/jira-plan`
  - Reads Jira and the code, asks me, writes the plan. Up close on the
    next slide.
- **Review the plan**
  - Where most of my time goes.
- **Implement**
  - Sol and Luna, phase by phase. Nothing is committed yet.
  - If asked: Sol is the agent I talk to. It hands bounded tasks to Luna
    workers, one repo each, and checks their work itself.
- **Manual testing**
  - Rider and the dev server. My step.
- **Review** `/jira-review` `/code-review`
  - The plan first, then the code.
- **Ship** `/jira-ship`
  - Commits and pull requests in every repo, in one step.

## 6. Plan from the story

The second step up close: what goes in, and what comes out.

- **The Jira ID, once**
  - I give it once, when I scope the work, and the feature folder
    records it. `/jira-plan` needs no ID, and nor does any later step.
- **Nothing copied by hand**
  - It reads the whole story through `twg`, comments included. No
    copy-pasting, and no acceptance criteria missed.
- **One plan for every repo**
  - One file for the whole task, outside the repos, so it is never
    committed.
- **On screen:** what it reads and writes
  - The story and the code in every repo go in. It asks what it cannot
    decide, then writes the plan.
- If asked, the questions:
  - Costly-to-change questions come to me one at a time, with options:
    its suggestions, my own answer, or defer to the team.
  - Small, easy-to-change choices it makes itself and lists in the plan.
  - Deferred questions go to the story as one Jira comment, lettered so
    the team can answer "1A". I confirm the text before it is posted.

## 7. Test, review, then ship

Nothing is committed before shipping, so fixes land in the same commits.

- **Does it work?** Manual testing, when the change needs it
  - In Rider and the dev server; Sol does not start backends. Bugs go
    back to Sol.
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
  - Answer, plan review, manual testing, manual review, merge.
  - The plan review is most of my work. A loop: Sol changes the plan
    until I approve it.
  - Manual review: I read the diff and the review findings before
    shipping.
- **Dashed: not always needed**
  - Manual testing, `/code-review` and manual review: I skip them when
    the change is small or the checks cover it. `/jira-ship` still checks
    against the plan.
- If asked, the ways back:
  - Deferred questions go to the team; the answers go to `/jira-plan`.
  - Bugs and missing work go back to Implement.
  - `/code-review` comments: I pick the fixes, and it can run again.

## 9. Demo

`RUN` behind the title is how you started a program on a C64.

What to show, in order:

- One story, several repos: one feature folder, `cpyolo`, then
  `/jira-plan`.
- The plan and its questions: answer some, defer one, then the plan
  review.
- A question posted with twg: show the comment, confirm it, and the run
  stops.
- `[Pick a story that spans at least two repos.]` No open questions is a
  valid outcome too. If it runs long, skip slide 10.

## 10. Takeaways

- **Build your tools:** It is cheap to build the tools you need.
  - `wag` and `cpyolo` fit my way of working. The skills are Markdown
    files.
- **Pick your models:** Use what works for you. I use Sol 6.1 and Luna for
  most things.
  - Try a few, and keep what gives you good results.
- **twg:** A simple way to integrate with Atlassian.
  - Jira and Confluence from the terminal, for you and for the agent.
- If there is time, what I like most:
  - Yolo mode in the sandbox: I babysit the agent less.
  - One plan from the Jira story, for the whole task.
  - Several stories in parallel, a feature folder each.
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
