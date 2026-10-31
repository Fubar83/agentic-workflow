# Agentic setup

Skills and agents for GitHub Copilot CLI that take a Jira story to pull
requests across several repositories, working in one feature folder.

## Contents

| Path | Purpose |
| --- | --- |
| `agents/Sol Orchestrator.agent.md` | Main agent. Plans, delegates, integrates, verifies, commits. |
| `agents/Luna Worker.agent.md` | Worker agent. Bounded tasks in one repository. Started only by Sol. |
| `skills/jira-plan/` | Builds the implementation plan from the story. |
| `skills/jira-review/` | Checks the implemented change against the plan. |
| `skills/jira-ship/` | Commits, pushes, opens pull requests, updates the story. |
| `skills/jira-refine/` | Prepares stories for a refinement session. Separate from the loop. |
| `wag/feature-manifest.sh` | Writes `FEATURE.md` when a feature folder is created. |

`/code-review`, used in the loop, is a separate skill of mine and is not
included here.

## Install

Copy the files into the container's home directory:

```
agents/*.agent.md   ->  ~/.copilot/agents/
skills/<name>/      ->  ~/.copilot/skills/<name>/
```

Use these personal locations. Project locations (`.github/agents/`,
`.github/skills/`) belong to a repository, and a feature folder is not one.

Start Sol from the feature folder:

```
copilot --agent "Sol Orchestrator" --yolo
```

`--agent` matches the agent's file name or its `name:` field; both are
`Sol Orchestrator`. `--yolo` is the same as `--allow-all`: no tool, path, or
URL prompts. `cpyolo` is my alias for this command.

Do not add `--no-ask-user`, and do not run planning in autopilot mode. Both
stop the agent from asking questions, and `jira-plan` depends on asking them.

## The loop

```
feature folder   wag: one worktree per repository, FEATURE.md written
cpyolo           Sol starts in the feature folder
/jira-plan       plan across all repositories; interview; stops on open questions
plan review      you read .working-docs/<jira-key>.md, then tell Sol to implement
implement        Sol, with Luna workers per repository
/code-review     correctness (separate skill)
/jira-review     conformance to the plan; suggestions for instruction files
/jira-ship       commits, pull requests in landing order, Jira comment
```

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
| `jira-review` | You (`/jira-review`), Sol before shipping, or `jira-ship` if it has not run since the last change |
| Accepting instruction-file suggestions | You |
| `jira-ship` | You (`/jira-ship`, or ask Sol to ship) |
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
  `jira-ship` reads it and adds pull request links.

A repository with an empty diff is fine if its phases are `done` or
`dropped`. If any are still `pending`, `jira-review` reports it and
`jira-ship` stops.

## Interview questions

`jira-plan` asks only questions that block the plan. Each lists, in order:

1. The options it suggests, with what each means for the implementation.
2. Your own answer, in free text.
3. Defer to the team. This stops the run.

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
  `.github/copilot-instructions.md`) from the git root and the working
  directory. The feature folder is neither, so Sol, Luna, and `jira-plan`
  read each repository's instruction files themselves.

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
- **Parallel workers are not guaranteed.** Sol starts independent workers
  together, but Copilot's documented way to run subagents in parallel is
  `/fleet`.
- **The `agents:` field in the agent files comes from VS Code.** Copilot CLI
  does not document it. Delegation does not depend on it: Sol can use any
  tool, and Luna's tool list has no tool for starting agents, so Luna cannot
  delegate further.

## First run checklist

Nothing has been run end to end yet. Check, in order:

1. `wag <feature> <repos…>` writes `FEATURE.md` with the right key and
   repositories. The script has only been tested with wag's variables set by
   hand.
2. `/skills list` shows `jira-plan`, `jira-review`, `jira-ship`, and
   `jira-refine`.
3. `/agent` lists Sol Orchestrator and not Luna Worker.
4. `cpyolo` expands to the start command above, with no `--no-ask-user`.
5. Sol runs on the model you expect. The agent file asks for `GPT-6.1 Sol`.
   Copilot treats `model:` as a preference unless `model-policy: required`
   is set.
6. Inside the container, `twg` can read a story and `gh auth status`
   succeeds. Both go through the proxy.
7. The projects folder with the main checkouts is visible inside the
   container.
8. On a small story, Sol reads `FEATURE.md` and runs `jira-plan`. Questions
   come with suggested options, a free-text answer, and Defer to the team.
   Answer one in free text and check it is recorded as a decision.
9. Defer one question. Expect one Jira comment, a plan file starting with
   `Plan status: blocked on Jira answers`, and the run stopping.
10. Implementation: Sol starts a Luna worker per repository. `/tasks` shows
    whether they run at the same time. Each worker's report lists the
    instruction files it read.
11. Run `/jira-ship` on a story where opening pull requests is fine. Expect
    `/jira-review` to run first, titles ending in `(#KEY)`, and dependent
    pull requests opened as drafts.

## Conventions

- Commit subjects include the Jira key.
- Pull request titles end with the key in parentheses:
  `Add retry to orders (#VFS-1234)`.
- Deferred questions go in one Jira comment per run.
