# Speaker notes

Slot: 20 to 30 minutes, about 100 engineers. Allow roughly 6 to 8 minutes for
the demo (an estimate; time a run-through). Sections are numbered to match the
slide counter.

Text in `[brackets]` is for you to fill in. Everything else describes how the
setup works.

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
5. The agent implements it.
6. Review: `/code-review` (my own skill), then `/jira-review` against the
   plan.
7. Ship: `/jira-ship`.

Points to make:

- The plan review (step 4) is where I spend my attention.
- Shipping is one step: commits, pull requests, and the ticket comment.

## 4. The plan step closes the gaps

The core of the talk. Give it time.

- The skill reads the story through `twg`, Atlassian's Teamwork Graph CLI, and
  the code in every repository in the folder. It writes one plan covering all
  of them.
- Before writing phases, it asks me questions. Each has the options it
  suggests, with what each means, then a free-text option for my own
  answer, then "Defer to the team". Choosing that stops the run.
- A free-text answer is recorded as a decision like the others. If it is
  unclear or conflicts with the code, the agent asks a follow-up.
- It sorts questions first. Reversible ones (naming, structure) it decides
  itself and records as provisional. Only blocking ones (schemas, contracts,
  ownership, security) come to me.
- The plan is written so a fresh session can implement from it: side effects
  per phase, current behaviour, patterns to follow, traps, out of scope.

## 5. Outstanding questions stop the run

- If any question is deferred, the agent posts one comment on the story: the
  decisions made, the provisional decisions, and the open questions with
  enough context to answer them. All deferred questions go in that one
  comment.
- It then saves the plan, marked blocked, and stops. No implementation.
- If nothing is deferred, the plan is marked ready and the run still stops,
  for my review. Implementation starts when I say so.
- When the story has answers, the next run reads the saved plan, keeps its
  decisions, and asks only what is still open.

## 6. Two reviews, then ship

- `/code-review` checks correctness. It is my own skill, separate from this
  set, and I run it myself.
- `/jira-review` checks the change against the plan: every phase done or
  dropped with a reason, every acceptance criterion covered by a check that
  ran, nothing in the diff that the plan did not call for.
- `/jira-ship` commits per repository with the Jira key, opens pull requests
  in merge order, cross-links them, and comments on the story with the links.
  Pull request titles end with the key, for example `(#VFS-1234)`.
- `/jira-ship` runs `/jira-review` first if it has not run since the last
  change. It stops if the plan is blocked, a phase is unfinished, a
  repository has changes the plan does not account for, or the review does
  not conform.
- Each skill can be typed, or Sol runs it when asked in plain words, such as
  "ship it".

## 7. Chapter two: what makes it work

Transition. Two things: one folder per change, and the agents.

## 8. One folder, every repo

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

## 9. Sol delegates, then integrates

- `cpyolo` is my alias: it starts Copilot CLI with the Sol agent selected, in
  yolo mode.
- Sol coordinates. Bounded work goes to Luna worker agents: a broad search,
  one repository's implementation slice, a verification run.
- Workers in different repositories cannot conflict, so Sol starts them
  together. Work that shares files or depends on order runs in sequence.
- `[Confirm in a test run that Copilot runs the workers concurrently; /tasks
  lists them. If it does not, /fleet is Copilot's documented way to run
  subagents in parallel.]`
- Workers return only their results, which keeps Sol's context focused on the
  plan.
- Sol does not accept a worker's "done" as verification. It reruns the
  checks.

## 10. Chapter three: where it runs

Transition. The environment the agent runs in, which is what lets it work
without asking me before every command.

## 11. The container sets the limits

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

## 12. Demo

Before starting, say what to watch for:

- One folder spanning several repositories.
- The plan review.
- A question deferred to the team, and the run stopping.

`[Pick a story that spans at least two repositories, and decide in advance
whether you expect a deferred question.]`

If the plan comes back with no open questions, say so; that is a valid
outcome. If the demo runs long, skip slide 13.

## 13. What I like

- Setup: one folder and one command, with every repository in it.
- Questions: answered before any code is written, or handed to the team with
  enough context to answer them.
- Record: open questions go to the ticket with the decisions made so far, and
  the pull request links follow when it ships.
- `[Say what you like most, in your own words. If you have measured
  anything, such as time from story to pull request, add the numbers.]`

Limits worth stating:

- The result depends on how well the story is written.
- Backend changes are verified by me, in Rider.
- Pushing and opening pull requests are always my decision.

## 14. Questions

On screen: the letters of FSP play pong. Each side has three score slots,
filled as that side scores, and the first to three wins. Then they line up
as FSP again and start over. It runs only while this slide is open, and
shows a still frame when the system asks for reduced motion.

Likely questions, with factual answers:

- **Can I use this?** The skills and agents are Markdown files. The folder
  pattern works with plain `git worktree`; `wag` is optional. `/code-review`
  is a separate skill of mine and not part of the set.
- **What about secrets and data?** The container has no internet access
  beyond approved domains and no cloud credentials. It can reach GitHub;
  pushing outside `/jira-ship` is ruled out by instruction, not by the box.
- **Does it work for small changes?** Yes. The plan's depth scales with the
  risk of the change.
- **How long did it take to set up?** `[Your answer.]`
