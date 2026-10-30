---
name: jira-review
description: 'Review an implemented change against its approved plan: every phase done or dropped with a reason, every acceptance criterion covered by code and by a check that was actually run, no changes the plan did not call for, recorded decisions honoured, cross-repository contracts consistent. Complements a general code review; does not replace it.'
argument-hint: 'Jira key, or nothing to use the plan in this feature folder'
---

# Review against the plan

A code review asks whether the code is correct. This review asks whether the
change is what the plan agreed, and whether the plan still describes it. Run
it after implementation and `/code-review`, before `/jira-ship`. `jira-ship`
also runs it when it has not run since the last change.

The review is read-only. Do not fix, edit, or commit. Report findings and let
the user decide.

## Scope

You run in a feature folder: one git worktree per repository, all on the same
feature branch. Read `FEATURE.md` at the folder root for the Jira key,
branch, and repositories, and `.working-docs/<jira-key>.md` for the plan. If
there is no plan, say so and stop; do not substitute a general code review.

Reads outside the folder follow the same rules as elsewhere: main checkouts
only, never another feature folder or task worktree, and nothing is modified.

Review the full diff of the feature branch against its base in each
repository, not only recent commits.

An empty diff is a finding only if the plan expected changes. Check the
repository's phases:

- All `done` or `dropped` with a reason: the empty diff is correct.
- Any still `pending`: finding.
- No phases at all, but the repository has changes: finding.

## Checks

1. **Phases.** Every phase is `done` or `dropped` with a reason. A phase that
   is neither is a finding.
2. **Acceptance criteria.** Each criterion traces to code and to a check that
   was run. A criterion supported only by a claim is not covered.
3. **Scope.** Every change traces to a phase. Changes the plan did not call
   for are findings, including improvements: they were not part of the agreed
   change and enlarge the pull request.
4. **Side effects.** The plan lists what each phase affects: callers,
   contracts, data, config, alerts, deploy order. Check each was handled.
5. **Decisions.** Check the code against the decisions recorded in the plan.
   Report any decision reversed during implementation.
6. **Cross-repository contracts.** Where repositories meet (APIs, events,
   schemas, shared packages), check both sides against each other and confirm
   the landing order still holds.
7. **Verification.** Run the plan's checks yourself. Separate what you ran
   and observed from what you infer. Report pre-existing failures separately.
8. **Plan accuracy.** If implementation departed from the plan, the plan
   should record the change. A plan that describes an abandoned approach is a
   finding.

## Report

Start with one verdict:

- `Conforms`: the change matches the plan, and any departures are recorded in
  it.
- `Diverges`: it does not, as listed.
- `Cannot tell`: the plan is too vague to review against; say what is
  missing.

Then list findings, most severe first. For each: repository, file and line,
the plan item concerned, and what would resolve it. Say explicitly when a
check found nothing. End with what you ran and what you could not run.

## Output

No icons, emoji, decorative separators, or checkbox glyphs. Do not restate
the plan. Report only where the change and the plan differ, and where you
could not tell.
