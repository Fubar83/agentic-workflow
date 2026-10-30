# Feature manifest

`feature-manifest.sh` is a `wag` start-profile step. It writes `FEATURE.md`
at the root of a feature folder, recording the Jira key, branch, and
repositories:

```yaml
feature: feature-vfs-1234
branch: feature-vfs-1234
jira: VFS-1234
created: 2026-10-29
repos:
  - name: fsp-marketconfiguration-service
    path: <projects>/features/feature-vfs-1234/fsp-marketconfiguration-service
  - name: fsp-integration-service
    path: <projects>/features/feature-vfs-1234/fsp-integration-service
```

`jira-plan`, `jira-review`, and `jira-ship` read this file first, so the
agents do not need to be told which story or repositories are in scope.

## Setup

Copy the script next to the wag config, as `~/.config/wag/feature-manifest.sh`.
wag runs a step whose first word is a file next to the config as
`bash <file>`, so no `chmod` is needed.

```yaml
start:
  manifest:
    - feature-manifest.sh
  sol:
    - feature-manifest.sh
    - copilot --agent "Sol Orchestrator" --yolo
autostart: [manifest]
```

`wag feature-vfs-1234 <repos…>` then writes the manifest, and adding `+sol`
also starts the agent in the folder.

If `cpyolo` is a shell alias, it will not work as a start-profile step: wag
runs steps in a non-interactive bash, which does not load aliases. Use the
full command it expands to, or turn it into a script on `PATH`.

## Behaviour

- **No stdout.** Start profiles run on every wag call, including
  `cd "$(wag feature-vfs-1234 <repo>)"`, where wag's stdout is the path being
  captured. The script writes its one status line to stderr.
- **Only `manifest` autostarts.** For the same reason, autostarting `sol`
  would launch an agent every time wag is asked for a path. Start it with
  `+sol`.
- **Safe to re-run.** The repository list is regenerated, so a repository
  added later appears. The `jira:` key and `created:` date are preserved,
  whether set by an earlier run, by `jira-plan`, or by hand.

## Jira key

The key is taken from the feature name, case-insensitively, and written in
upper case: `feature-vfs-1234` gives `VFS-1234`. If the name contains no key,
`jira:` is left empty and `jira-plan` fills it in on its first run.

## Tested

Run with wag's environment variables set, covering: a fresh folder; a re-run
with a repository added (key and date kept, list refreshed); a hand-set key
kept on re-run; a name without a key; a single-repository call; lower-case,
upper-case, and alphanumeric keys. Not yet run under wag itself.
