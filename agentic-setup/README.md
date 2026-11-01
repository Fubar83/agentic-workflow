# Agentic setup

Skills and agents for GitHub Copilot CLI that take a Jira story to pull
requests across several repositories, working in one feature folder.

## Contents

| Path | Purpose |
| --- | --- |
| `agents/sol-orchestrator.agent.md` | Main agent. Plans, delegates, integrates, verifies. |
| `agents/luna-worker.agent.md` | Worker agent. Bounded tasks in one repository. Started only by Sol. |
| `skills/jira-plan/` | Builds the implementation plan from the story. |
| `skills/jira-review/` | Checks the implemented change against the plan. |
| `skills/jira-ship/` | Commits, pushes, opens pull requests, updates the story. |
| `skills/jira-refine/` | Prepares stories for a refinement session. Separate from the loop. |
| `wag/feature-manifest.sh` | Writes `FEATURE.md` when a feature folder is created. |

`/code-review`, used in the loop, is a separate skill of mine and is not
included here. It compares the change with main, committed or not, and does
not read Jira; `/jira-review` checks the change against the plan.

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
/code-review     correctness (separate skill)
/jira-review     conformance to the plan; suggestions for instruction files
/jira-ship       a commit per phase, pull requests in landing order, Jira comment
```

The changes stay uncommitted until `/jira-ship`, so both reviews look at
local changes and fixes land in the same commits.

Each skill can be typed with `/`, or Sol runs it when asked in plain words
("plan VFS-1234", "ship it"). A typed skill is loaded into the current
agent's context, so Sol's rules still apply.

`/jira-refine` is not part of this sequence. It is run on stories before a
refinement session, usually without a feature folder.

## What is automatic

| Step | Started by |
| --- | --- |
| Creating the feature folder | You (`wag`) |
| `FEATURE.md` | wag start profile (`autostart`) |
| Starting Sol | You (`cpyolo`) |
| `jira-plan` | You (`/jira-plan`), or Sol when there is no plan file |
| Approving the plan | You |
| Implementation and Luna workers | Sol, when you say to implement |
| Phase status in the plan | Sol |
| `/code-review` | You |
| `jira-review` | You (`/jira-review`), or `jira-ship` if it has not run since the last change |
| Accepting instruction-file suggestions | You |
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
- **Jira comments are posted without confirmation.** `jira-plan`,
  `jira-refine`, and `jira-ship` show the comment and then post it.
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
2. `/skills list` shows `jira-plan`, `jira-review`, `jira-ship`, and
   `jira-refine`.
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
9. Defer one question. Expect one Jira comment, a plan file starting with
   `Plan status: blocked on Jira answers`, and the run stopping.
10. Implementation: Sol starts a Luna worker per repository. `/tasks` shows
    whether they run at the same time, and that no worker starts its own.
    Each worker's report lists the instruction files it read. When Sol
    reports done, nothing is committed.
11. `/code-review`, run from the feature folder, reviews every worktree,
    since the folder itself is not a git repository. It also reviews new
    files: they stay untracked until `/jira-ship`, and `git diff main` does
    not show untracked files.
12. Run `/jira-ship` on a story where opening pull requests is fine. Expect
    `/jira-review` to run first, one commit per phase, titles ending in
    `(#KEY)`, and dependent pull requests opened as drafts. Run it again
    after a small change: it should push to the open pull requests, not
    open new ones.

## Conventions

- Commit subjects include the Jira key.
- Pull request titles end with the key in parentheses:
  `Add retry to orders (#VFS-1234)`.
- Deferred questions go in one Jira comment per run.
