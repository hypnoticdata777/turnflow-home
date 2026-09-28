# TurnFlow Home Documentation — Start Here

**Last updated:** 2026-09-28 · Latest change: [P0 security release](09-changes/2026-09-28-p0-security.md) · Latest review: [PDF](review/2026-09-28-repo-review.pdf)

This folder is organized as a chain. Each numbered folder is one step of the
engineering loop, so you can read it in order or jump to the step you need:

```text
Problem → Requirements → Inputs/Outputs → Constraints → Algorithm → Pseudocode
        → Flowchart → Implementation → Tests → Refinement → Documentation
```

Every core flow in [`04-algorithms/`](04-algorithms/) walks through all eleven
steps in that same order. Every flow also names the node it lives on in the
**system map**, so you can always zoom out.

## Reading paths

| You are... | Read this, in order | Time |
|---|---|---|
| **New to the project, non-technical** (friend, recruiter, homeowner) | [Problem](01-problem/problem.md) → [System map, Level 0 only](00-overview/system-map.md#level-0--the-whole-product-on-one-page) → [Request lifecycle](04-algorithms/04-request-status-lifecycle.md) (the state diagram) | 10 min |
| **An engineer or reviewer** | [System map](00-overview/system-map.md) → [Code map](05-implementation/code-map.md) → [Data model](03-design/data-model.md) → any [flow doc](04-algorithms/) → [Test strategy](06-testing/test-strategy.md) | 45 min |
| **An investor or advisor** | [Problem](01-problem/problem.md) → [System map](00-overview/system-map.md) → [Review report (PDF)](review/2026-09-28-repo-review.pdf) → [Roadmap and findings](07-refinement/findings-and-roadmap.md) | 30 min |
| **Operating the app** | [P0 rollout runbook](08-operations/p0-rollout-runbook.md) → [Deployment runbook](DEPLOYMENT.md) → [QA checklist](QA_CHECKLIST.md) | 20 min |
| **Seeing what changed and why** | [P0 security changes: before → after](09-changes/2026-09-28-p0-security.md) → [Build log index](07-refinement/build-log/README.md) | 20 min |

## The folders

| # | Folder | Step(s) of the chain | What's inside |
|---|---|---|---|
| 00 | [`00-overview/`](00-overview/) | the big picture | [System map](00-overview/system-map.md): Level 0 → Level 1 → Level 2 flowcharts, with every review finding pinned to its place |
| 01 | [`01-problem/`](01-problem/) | Problem | [Problem statement, users, jobs-to-be-done](01-problem/problem.md) |
| 02 | [`02-requirements/`](02-requirements/) | Requirements | [Requirements index](02-requirements/README.md), which links the existing requirements matrix and endpoint map |
| 03 | [`03-design/`](03-design/) | Inputs/Outputs, Constraints | [Inputs & outputs](03-design/inputs-outputs.md), [Constraints](03-design/constraints.md), [Data model (ERD)](03-design/data-model.md) |
| 04 | [`04-algorithms/`](04-algorithms/) | Algorithm, Pseudocode, Flowchart | One design doc per core flow, each with all 11 steps ([index](04-algorithms/README.md)) |
| 05 | [`05-implementation/`](05-implementation/) | Implementation | [Code map](05-implementation/code-map.md): every file, and which flow it belongs to |
| 06 | [`06-testing/`](06-testing/) | Tests | [Test strategy](06-testing/test-strategy.md): what is covered, how, and what is missing |
| 07 | [`07-refinement/`](07-refinement/) | Refinement | [Findings & roadmap](07-refinement/findings-and-roadmap.md), [monthly build logs](07-refinement/build-log/README.md) |
| 08 | [`08-operations/`](08-operations/) | Operations | [P0 rollout runbook](08-operations/p0-rollout-runbook.md) |
| 09 | [`09-changes/`](09-changes/) | Refinement (change records) | [2026-09-28 P0 security changes: before → after](09-changes/2026-09-28-p0-security.md) |
| — | [`review/`](review/) | Documentation | [2026-09-28 repo review](review/2026-09-28-repo-review.md) ([PDF](review/2026-09-28-repo-review.pdf)) |

## Earlier documents (kept for history, still valid)

These files were written before this structure existed. They were **not moved
or deleted**, so older links still work. Each one now opens with a banner that
points to its place in the new structure.

| File | Now indexed under |
|---|---|
| [`BUILD_LOG.md`](BUILD_LOG.md) | Frozen archive → split into [`07-refinement/build-log/`](07-refinement/build-log/README.md) |
| [`USER_REQUIREMENTS_EVENT_MATRIX.md`](USER_REQUIREMENTS_EVENT_MATRIX.md) | [`02-requirements/`](02-requirements/README.md) (still the current requirements source) |
| [`ENDPOINT_EXPERIENCE_MAP.md`](ENDPOINT_EXPERIENCE_MAP.md) | [`02-requirements/`](02-requirements/README.md) (still current) |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | [`08-operations/`](08-operations/p0-rollout-runbook.md) (still current) |
| [`QA_CHECKLIST.md`](QA_CHECKLIST.md) | [`06-testing/`](06-testing/test-strategy.md) (still current) |
| [`USER_TESTING.md`](USER_TESTING.md) | [`06-testing/`](06-testing/test-strategy.md) (still current) |
| [`UI_UX_REVIEW.md`](UI_UX_REVIEW.md) | [`07-refinement/`](07-refinement/findings-and-roadmap.md) (still current) |
| [`UI_UX_FINDINGS.md`](UI_UX_FINDINGS.md) | [`07-refinement/`](07-refinement/findings-and-roadmap.md) (still current) |
| [`VENDOR_LIFECYCLE_ROADMAP.md`](VENDOR_LIFECYCLE_ROADMAP.md) | [`07-refinement/`](07-refinement/findings-and-roadmap.md) (still current) |

## Conventions used in every flow doc

- **Map node IDs** such as `[C] Files` refer to boxes on the
  [system map](00-overview/system-map.md).
- **Finding IDs** such as `F1` refer to the
  [findings register](07-refinement/findings-and-roadmap.md).
- **Pseudocode** is strict and language-neutral: `REQUIRE` stops with an error
  when false, `IF … THEN`, `FOR EACH`, `RETURN`. It mirrors the real code line
  for line, and the Implementation section names the file and function.
- **Flowcharts** are Mermaid, so they render on GitHub and can be pasted into a
  website. Dashed boxes marked **THOUGHT** explain *why* a decision exists.
