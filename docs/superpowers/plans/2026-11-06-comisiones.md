# Comisiones Ashley Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Continuous implementation authorized by user.

**Goal:** Register optical sales and fixed USD commissions in user-defined periods.
**Architecture:** Next.js App Router and authenticated route API, Prisma SQLite, token sessions and responsive React interface.
**Tech Stack:** JavaScript, Next.js, React, Tailwind, Prisma 6, SQLite, Recharts.
**Spec:** docs/superpowers/specs/2026-11-06-comisiones-design.md

## Global Constraints

- USD currency, only authentication token in localStorage.
- User ashley / password ashley; edit key 1111 initially; server verification.
- Bottom navigation, glass/light blue design; no seeded sales.
- Existing isolated cloud checkout; no worktree required.

## Review Focus

- Invalid or excessively large money must never be persisted.
- Date edits must resolve the correct nonoverlapping quincena.
- Unauthorized API callers cannot read data or mutate records.
- Hidden aggregate cannot leak through other views or chart totals.
- Remembered access survives reload and is revoked on logout.

### Task 1: Data and business rules

Files: prisma/schema.prisma, lib/domain.mjs, tests/domain.test.mjs, lib/db.js.

- [x] Test money, valid calendar dates, required invoice and periods (run node --test).
- [x] Implement validation and integer-cent storage; generate Prisma migration.
- [x] Verify tests and repeatable database startup.

### Task 2: Authenticated API

Files: lib/auth.js, lib/service.js, app/api/[...path]/route.js, tests/api.test.mjs.
Interfaces: GET /api/state returns settings, periods, sales; POST /api/auth/login returns token; Bearer-authenticated sales/periods/settings routes.

- [x] Test login, access denial, mutation password, period overlap, date reclassification and logout.
- [x] Implement hashing, sessions, throttling, transactional mutations and safe responses.
- [x] Run API integration tests against isolated test database.

### Task 3: App interface

Files: app/layout.js, app/page.js, app/globals.css, components/*.
Consumes /api/state and mutation endpoints. Displays persisted sales in dashboard, history and charts.

- [x] Implement login, period management, sale form, table/detail, charts and settings with accessible dialogs.
- [x] Run production build and mobile/desktop browser checks, core sale workflow and remembered session.
- [x] Compare concept and rendered screenshot with view_image; fix drift.

### Task 4: Delivery

Files: README.md, .env.example, install/start scripts, reusable cloud configuration.

- [x] Review implementation with fresh reviewer and address material findings.
- [x] Verify production startup and persistence. Public preview blocked by network: CONNECT to api.trycloudflare.com returns 403. Network domains saved in draft; runtime unchanged.
- [x] Save reproducible environment configuration and report exact hosting limits.
