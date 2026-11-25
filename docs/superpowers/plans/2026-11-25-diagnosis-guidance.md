# First Diagnosis Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the first diagnosis actionable while preserving optional follow-up, Guidance and Compare.
**Architecture:** Reuse expression_advice for whole-answer organization. Add optional evidence_gap and thinking_hints; the latter is a single source for supplementary thinking and follow-up answer directions. Render within the existing four cards. Keep Guidance/Compare payloads unchanged.
**Tech Stack:** Existing React, TypeScript, Express, AJV, Node Test Runner and Playwright; no dependencies.
**Spec:** User's complete task in this chat, 2026-11-25.

## Global Constraints
- Local changes only; no commit, push, deployment or paid API calls.
- Preserve legacy JSON responses and the single main question rule.
- No full essay, invented facts, mandatory STAR or forced follow-up for sufficient evidence.
- Whole-answer framework precedes supplement; Guidance alone integrates the user's actual supplement.

## Review Focus
- Old responses with no added fields render normally.
- Structure-only and clear responses bypass supplemental input, including retry after Guidance failure.
- Hints are bounded recall fragments, not multiple questions or unconfirmed facts.
- Shared thinking hints appear once and are never promoted into actual evidence.
- Same supported new fields work through API, mobile and desktop, with no Guidance/Compare schema changes.

### Task 1: Contract and Prompt
**Files:** `server/contracts.mjs`, `schemas/diagnosis.schema.json`, `server/prompts.mjs`, new synthetic fixtures/tests.
- [x] Add optional evidence_gap (nullable short text) and thinking_hints (empty or 2–4 short fragments).
- [x] Keep required keys unchanged; reject evidence gaps/hints attached to a no-question response.
- [x] Add six synthetic regression candidates and validate legacy, length, JSON, quote and one-question behavior without models.
- [x] In Prompt distinguish whole-answer structure, shared recall hints and later Guidance; bound density, preserve truth and scene rules.

### Task 2: Existing cards and flow
**Files:** `src/App.tsx`, `src/styles.css`, `tests/e2e.spec.ts`.
- [x] Embed expression_advice into module 02, rename to 最值得优化的地方 and show evidence_gap only when supplied.
- [x] Show shared thinking_hints once under follow-up with optional-selection wording; remove repeated fragments.
- [x] No-question branches go directly to Guidance; preserve same input for final retell and Compare.
- [x] Test six cases on desktop/mobile, legacy fallback, empty supplement and Guidance failures.

### Task 3: Verification and record
- [x] Run tracked Node tests plus existing local cases, TypeScript, production build and all browser flows.
- [x] Capture synthetic before/after examples and screenshots, explicitly distinguish Mock/contract checks from real model quality.
- [x] Record modified files and remaining human/real-model acceptance; leave all changes local.
