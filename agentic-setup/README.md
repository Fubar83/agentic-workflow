# Agentic setup

Skills and agents for GitHub Copilot CLI that take a Jira story to pull
requests across several repositories, working in one feature folder.

## Contents

| Path | Purpose |
| --- | --- |
| `AGENTS-AND-SKILLS.md` | What each agent and skill does, how, and why. |
| `agents/sol-orchestrator.agent.md` | Main agent. Plans, delegates, integrates, verifies. |
| `agents/luna-worker.agent.md` | Worker agent. Bounded tasks in one repository. Started only by Sol. |
| `skills/jira-plan/` | Builds the implementation plan from the story. |
| `skills/jira-review/` | Checks the implemented change against the plan. |
| `skills/code-review/` | Reviews the change in every repository against its base branch. |
| `skills/jira-ship/` | Commits, pushes, and opens pull requests. Writes nothing to Jira. |
| `skills/jira-refine/` | Prepares stories for a refinement session. Separate from the loop. |
| `wag/feature-manifest.sh` | Writes `FEATURE.md` when a feature folder is created. |

The two reviews split the work. `/jira-review` comes first and checks the
change against the plan. `/code-review` then checks it for regressions and
side effects against each repository's base branch, committed or not, and
reads neither Jira nor the plan.

## Install

Use Copilot CLI 1.0.100 or later (`copilot --version`). Luna declares the
`search` tool alias, and earlier versions do not give custom agents the
tools behind it.

Copy the files into the container's home directory:

```
agents/*.agent.md   ->  ~/.copilot/agents/
skills/<name>/      ->  ~/.copilot/skills/<name>/
```

Use these personal locations. Project locations (`.github/agents/`,
`.github/skills/`) belong to a repository, and a feature folder is not one.

Start Sol from the feature folder:

```
copilot --agent sol-orchestrator --yolo
```

`--agent` takes an agent's ID, which is its file name without `.agent.md`,
or its `name:` in quotes, so `--agent "Sol Orchestrator"` also works.
`--yolo` is the same as `--allow-all`: no tool, path, or URL prompts.
`cpyolo` is my alias for this command.

The first start in each new feature folder asks whether to trust the
folder. Trust covers the folder and everything in it.

Do not add `--no-ask-user`, and do not run planning in autopilot mode. Both
stop the agent from asking questions, and `jira-plan` depends on asking them.

## The loop

```
feature folder   wag: one worktree per repository, FEATURE.md written
cpyolo           Sol starts in the feature folder
/jira-plan       one plan across all repositories, after an interview; then stops
plan review      you read .working-docs/<jira-key>.md, then tell Sol to implement
implement        Sol, with Luna workers per repository; nothing is committed yet
/jira-review     conformance to the plan; suggestions for instruction files
/code-review     correctness, every repository against its base branch
/jira-ship       a commit per phase, pull requests in landing order
```

The changes stay uncommitted until `/jira-ship`, so both reviews look at
local changes and fixes land in the same commits.

Each skill can be typed with `/`, or Sol runs it when asked in plain words
("plan VFS-1234", "ship it"). A typed skill is loaded into the current
agent's context, so Sol's rules still apply.

`/jira-refine` is not part of this sequence. It is run on stories before a
refinement session, usually without a feature folder.

## Next step and skipping

At the end of each step, Sol offers the next one. In Copilot's question
prompt, the recommended step comes first, then any shorter routes, then
Stop here. You can type something else instead. Picking `/jira-ship`
counts as asking to ship.

A small change touches one repository and a few files, and no contract,
schema, migration, or permission. For one, you can skip:

- **The plan review.** Pick Implement as soon as the plan is ready, or ask
  up front: "plan and implement VFS-1234". A blocked plan still stops.
- **`/code-review`.** After a `Conforms` verdict, Sol offers `/jira-ship`
  instead.
- **The separate `/jira-review`.** After implementation, Sol offers
  `/jira-ship` as well. It runs `jira-review` first and skips
  `/code-review`.

Sol never skips a step on its own. On a larger change it does not offer
the shorter routes, but takes one when you ask. Some things always run:
`jira-plan` writes a plan, short for a small change, because `jira-review`
and `jira-ship` work from it; and `jira-ship` runs `jira-review` and the
plan's verification before it commits.

## What is automatic

| Step | Started by |
| --- | --- |
| Creating the feature folder | You (`wag`) |
| `FEATURE.md` | wag start profile (`autostart`) |
| Starting Sol | You (`cpyolo`) |
| `jira-plan` | You (`/jira-plan`), or Sol when there is no plan file |
| Posting a Jira comment | You, by choosing Post it |
| Approving the plan | You |
| Implementation and Luna workers | Sol, when you say to implement |
| Phase status in the plan | Sol |
| Offering the next step | Sol, at the end of each step |
| `jira-review` | You (`/jira-review`), or `jira-ship` if it has not run since the last change |
| Accepting instruction-file suggestions | You |
| `/code-review` | You |
| `jira-ship`: commits, push, pull requests | You (`/jira-ship`, or ask Sol to ship) |
| `jira-refine` | You (`/jira-refine`) |

Sol runs skills because its agent file names them. A skill run in a session
without Sol does not trigger the next step.

## The plan file

The skills and agents share one file, `.working-docs/<jira-key>.md` at the
feature folder root.

- **First line:** `Plan status: ready to implement` or
  `Plan status: blocked on Jira answers`.
- **Each phase** has a `Status:` of `pending`, `done`, or
  `dropped: <reason>`.
- **Lessons:** during implementation Sol adds a `Lessons` section: anything
  that cost a retry and that an instruction file would have prevented.
  `jira-review` turns it into suggestions for `AGENTS.md` and the other
  instruction files. Accepted suggestions become their own phase.
- `jira-plan` writes it. Sol updates phase status. `jira-review` reads it.
  `jira-ship` commits per phase from it and adds pull request links.
- It sits at the feature folder root, outside every repository, so it is
  never committed.

A repository with an empty diff is fine if its phases are `done` or
`dropped`. If any are still `pending`, `jira-review` reports it and
`jira-ship` stops.

## Interview questions

`jira-plan` asks only questions that block the plan. It lists them all
first, then asks them one at a time. Each offers, in order:

1. The options it suggests, with what each means for the implementation.
2. Your own answer, in free text.
3. Defer to the team. This stops the run once the interview is over.

In Copilot's question prompt, the suggested options and Defer to the team
are the choices. Copilot adds a free-text field to every choice prompt,
and that is where you type your own answer.
Reversible choices, such as naming, are not asked: the plan lists them as
provisional decisions.

All deferred questions go in one Jira comment.

## Jira comments

`jira-plan` and `jira-refine` never post without your confirmation. Each
shows the comment as the team will read it, names the story, and asks:
Post it or Don't post. Type what to change in the free-text field, and
the skill shows the revised comment and asks again. A confirmation covers
only the text you saw.

- **Don't post** posts nothing. A blocked plan stays blocked, and the
  draft stays in `.working-docs/<jira-key>-comment.md` for you to use
  another way.
- **Answers while refining.** If a change you type answers one of
  `jira-plan`'s deferred questions, it becomes a decision in the plan. If
  none is left open, nothing is posted and the plan is ready.
- **Several stories.** `jira-refine` drafts every comment first, then asks
  about each in turn, so you are not kept waiting between questions.

The comments are written to be read quickly, on a phone too. They open
with what the team needs to do. Each question is a bold line with a
sentence or two of context, then its options as a lettered list, each
with what it would change. The team can answer with a number and a
letter, such as 1B, and the next `jira-plan` run reads answers in that
form. The skills post Markdown, which `twg` turns into Jira formatting.

## Repository rules

- Every change stays inside the feature folder.
- Other repositories may be read, from their main checkout only. Another
  feature folder or task worktree is never read.
- Main checkouts are expected in the projects folder, the one that contains
  `features/`.
- A repository needed only for reading is read from main and gets no
  worktree.
- If planning finds a repository that needs changes and is not in the folder,
  the agent asks for its worktree to be added.
- Copilot loads instruction files (`AGENTS.md`,
  `.github/copilot-instructions.md`, and others) from the git root and the
  working directory. A feature folder is not a git repository and has no
  instruction files of its own, so Sol, Luna, and `jira-plan` read each
  repository's instruction files themselves.

## Environment assumptions

The agents are written for a devcontainer on rootless Podman over WSL 2:

- No direct internet. A proxy allows pre-approved domains only.
- No AWS credentials.
- One open port, for front-end dev servers.
- Backend services are run and debugged in Rider on the host.

If these change, update the Environment sections in both agent files.

## Known limits

- **Pushing is guarded by instructions, not the sandbox.** The container can
  reach GitHub, since `/jira-ship` pushes from it, and `--yolo` means nothing
  prompts. Sol and Luna are told never to push outside `jira-ship`. To
  enforce it instead, add a deny rule for `git push` to the start command and
  push by hand; deny rules apply even with `--yolo`.
- **Jira comments are guarded by instructions too.** `jira-plan` and
  `jira-refine` post a comment only once you confirm it, but with `--yolo`
  nothing else prompts before `twg` runs. `jira-ship` writes nothing to
  Jira.
- **`twg`'s comment flags come from its help.** Its command catalog lists
  `twg jira workitem comment create`, with HTML, Markdown, or plain text
  bodies, but not the flags. The skills read them from `--help` and set
  Markdown explicitly. Checklist item 9 shows whether the result renders.
- **Pull requests need `gh` and a GitHub remote.** On other hosts,
  `jira-ship` prints the title and description instead.
- **`--yolo` can be switched off by policy.** When
  `permissions.disableBypassPermissionsMode` is `disable`, for example in a
  managed setup, the allow-all options are suppressed at startup and
  Copilot asks before tools run.
- **Parallel workers are the model's choice.** Copilot CLI runs subagents
  concurrently, up to 32 per session by default, and `/tasks` lists them.
  Whether Sol starts several at once is up to the model; `/fleet` asks for
  it explicitly.
- **Luna not delegating is an instruction.** Its `tools:` list leaves out
  `agent`, but Copilot may add default tools, and subagents can start their
  own. If `/tasks` shows workers under Luna, add `strict-tools-list: true`
  to its frontmatter.
- **GitHub's references differ on some agent fields.** The CLI reference
  calls the switch for automatic delegation `infer`, the agent
  configuration reference `disable-model-invocation`. Sol sets both, so
  Copilot never picks Sol on its own, in any session. Luna's
  `user-invocable: false` is only in the configuration reference; checklist
  item 3 shows whether the CLI honours it. `agents:` and `argument-hint:`
  come from VS Code, and Copilot CLI ignores them.

## First run checklist

Nothing has been run end to end yet. Check, in order:

1. `wag <feature> <repos…>` writes `FEATURE.md` with the right key and
   repositories. The script has only been tested with wag's variables set by
   hand.
2. `/skills list` shows `jira-plan`, `code-review`, `jira-review`,
   `jira-ship`, and `jira-refine`. If an older `code-review` is installed
   outside `~/.copilot/skills/`, such as in `~/.agents/skills/`, remove it.
3. `/agent` lists Sol Orchestrator once, and not Luna Worker. Delete any
   `Sol Orchestrator.agent.md` or `Luna Worker.agent.md` left in
   `~/.copilot/agents/` by an earlier install.
4. `cpyolo` expands to the start command above, with no `--no-ask-user`,
   and Copilot runs commands without asking. If it asks, a policy has
   turned yolo mode off.
5. `/model` lists `gpt-6.1-sol` and `gpt-6-luna`, the models Sol and Luna
   ask for. Both are opt-in. A model you do not have falls back to the
   session's model without an error, unless `model-policy: required` is
   set.
6. Inside the container, `twg` can read a story and `gh auth status`
   succeeds. Both go through the proxy.
7. The projects folder with the main checkouts is visible inside the
   container.
8. On a small story, Sol reads `FEATURE.md` and runs `jira-plan`. The
   questions are listed first, then asked one at a time, with the suggested
   options and Defer to the team as choices. Type your own answer to one and
   check it is recorded as a decision.
9. Defer one question. Expect the draft comment and a question: post it,
   or type what to change. Type a change, check that the comment comes
   back with it, then choose Post it. Expect one Jira comment, a plan file
   starting with `Plan status: blocked on Jira answers`, and the run
   stopping. On the story, check that the comment renders: bold question
   lines, lettered options, and no stray `**`. Then reply `1A` and run
   `jira-plan` again: it should take that as the answer.
10. Implementation: Sol starts a Luna worker per repository. `/tasks` shows
    whether they run at the same time, and that no worker starts its own.
    Each worker's report lists the instruction files it read. When Sol
    reports done, nothing is committed.
11. Sol then offers the next step as a choice: `/jira-review` first, and
    `/code-review` after `Conforms`. On a small story, `/jira-ship` is among
    the choices at both points. On another small story, "plan and implement
    <KEY>" goes from the plan to implementation without stopping, unless a
    question is deferred.
12. `/code-review`, run from the feature folder, lists every worktree in its
    coverage, with the base it compared with and its new files. New files
    stay untracked until `/jira-ship`, and `git diff` does not show them, so
    check that one the change added was reviewed.
13. Run `/jira-ship` on a story where opening pull requests is fine, after
    fixing a `/code-review` finding. Expect `/jira-review` to run again
    first, one commit per phase, titles ending in `(#KEY)`, the plan's
    decisions in each description, dependent pull requests opened as
    drafts, and no comment on the story. Run it again after a small change:
    it should push to the open pull requests, not open new ones.
14. `/jira-refine` on two stories. Expect it to read both before asking
    anything, then to show each comment and ask about it in turn. Choose
    Don't post for one, and check that nothing reached that story.

## Conventions

- Commit subjects include the Jira key.
- Pull request titles end with the key in parentheses:
  `Add retry to orders (#VFS-1234)`.
- Deferred questions go in one Jira comment per run, with lettered options,
  so they can be answered as 1B.
- Nothing is posted to Jira until you confirm the comment.
