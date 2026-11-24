# ADR-0001: Modular all-in-one Next.js monorepo

Status: accepted. Date: 2026-11-24.

This repository implements the ADR as scaffolding. The monorepo uses pnpm workspaces and Nx. Apps do not import one another. Extracting `auth` and pruning domains are handled by `tools/scripts`.

Apps: gateway, auth, marketing, commerce, erp, industrial, streaming, game, chat, and realtime. Libs: ui, contracts, auth-client, data-mongo, cache-redis, tf-recommend, and testing-utils.

Rendering: SSG on the marketing home, ISR on the story and the catalog, SSR in the ERP, and CSR in the game, the chat, and the industrial dashboard.

State: TanStack Query for HTTP responses, Zustand for the cart, the offline queue, the game, and dismissed alarms.

Zod contracts generate OpenAPI 3.1. The `codegen` target runs Orval and emits hooks in `libs/contracts/src/generated`.

Realtime lives in `apps/realtime` and uses Redis Pub/Sub. Orders and media use Redis Streams.

Better Auth uses email and password. Google OAuth and magic link turn on through environment variables. The tenant is the active organization, checked against the `x-tenant-id` header in the gateway.

Languages: pt-BR and en. Tests: Vitest and Playwright. Docker Compose starts by profile.
