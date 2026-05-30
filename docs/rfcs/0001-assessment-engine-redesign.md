# RFC 0001: Rubric-based Assessment Engine redesign

- Status: Draft
- Created: 2026-05-30
- Updated: 2026-05-30

## Summary

Introduce a clean rubric-based assessment domain for Writing and Speaking. The new design models each Writing task and Speaking part as its own task type with a dedicated rubric, evidence schema, scoring policy, and strategy.

## Motivation

The existing grading pipeline is skill-based. Writing contains some task-aware logic, while Speaking uses one shared formula across all three parts. A capstone-grade assessment engine should make the rubric boundary explicit: shared analyzers extract signals, AI extracts evidence and supports feedback, and task-specific scoring policies compute final scores.

## Design

- Add assessment domain tables: rubrics, attempts, jobs, evidence, results.
- Add enums for skill, task type, source type, and job status.
- Add contracts for strategy, signal analyzer, evidence extractor, evidence validator, criterion scorer, feedback builder, and rubric resolver.
- Resolve rubrics by `AssessmentTaskType`, not only by skill.
- Keep final scores deterministic and traceable through criterion scores and calculation trace.

## Alternatives Considered

- Add part-specific params to current formulas: rejected because it hides task differences inside config and does not model rubric/evidence boundaries clearly.
- Keep legacy dual path: rejected because this is a capstone redesign and does not need backward-compatible legacy adapters.

## Implementation

- Phase 1: Add foundational schema, models, enums, DTOs, contracts, and rubric resolver.
- Phase 2: Add task-specific strategies and rubric seeders.
- Phase 3: Switch submission endpoints to the new assessment services.
- Phase 4: Add calibration and reporting tests.

## Open Questions

- Final rubric descriptors for each task type require supervisor review.
- Exact evidence schema per task type will be finalized with sample answers.
