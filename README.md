# Next Swiss Knife

An Nx and pnpm monorepo for starting a Next.js product and pruning what you do not use. Each domain is its own process. Shared libraries use the `@swiss/*` scope. The interface languages are `pt-BR` (the default) and `en`.

The decisions live in [docs/adr/0001-arquitetura-monorepo.md](docs/adr/0001-arquitetura-monorepo.md) and [docs/adr/0002-observabilidade.md](docs/adr/0002-observabilidade.md).

You need Node 22 or newer and pnpm 10. Docker is required when a flow uses MongoDB or Redis.

## First run

```bash
cp .env.example .env
pnpm install
pnpm codegen
docker compose --profile nosql --profile cache up -d
```

`pnpm codegen` writes `libs/contracts/openapi.json` and the generated client in `libs/contracts/src/generated`. Run it again after a Zod schema changes.

Start only the apps for the recipe you are using. The seed talks to auth after it is already up:

```bash
pnpm --filter @swiss/auth dev
pnpm seed
```

The account it creates is `ada@example.com`, password `correct-horse-battery`, organization Oficina Norte. The values come from `SEED_EMAIL`, `SEED_PASSWORD`, and `SEED_NAME`.

## Ports

| Port | Process | What it serves |
| --- | --- | --- |
| 3000 | gateway | API, BFF, Swagger at `/pt-BR/docs` |
| 3001 | auth | Sign-up, sign-in, and organization |
| 3002 | marketing | Home, story, and contact |
| 3003 | commerce | Catalog, cart, and checkout |
| 3004 | erp | Orders, audit trail, and offline queue |
| 3005 | industrial | Dashboard that consumes telemetry |
| 3006 | streaming | Media catalog and upload |
| 3007 | game | Canvas game |
| 3008 | chat | Messages and a WebRTC data channel |
| 3009 | realtime | WebSocket, SSE, and signaling |
| 3300 | grafana | Only with the `observability` profile |

Page routes use a locale prefix: `/pt-BR/...` and `/en/...`.

## Folders

### `apps/`

One directory, one process. Next apps do not import other apps. They talk through the gateway, over HTTP, or through Redis.

| Folder | Package | What it does |
| --- | --- | --- |
| `gateway` | `@swiss/gateway` | BFF, OpenAPI, `x-tenant-id` check, rate limit, `/api/healthz`, `/api/readyz`, `/api/metrics`, and `/api/client-errors` |
| `auth` | `@swiss/auth` | Better Auth with email and password. Google and magic link turn on only when their environment variables are set |
| `marketing` | `@swiss/marketing` | Static home, a story that revalidates every hour, and a lead form. It does not import the server logger |
| `commerce` | `@swiss/commerce` | Catalog, a Zustand cart, and checkout that writes the order through the gateway |
| `erp` | `@swiss/erp` | Lists the tenant's orders, consumes the `order.placed` stream, and stores offline notes |
| `industrial` | `@swiss/industrial` | Client dashboard. Machine state arrives over SSE |
| `streaming` | `@swiss/streaming` | Upload, ffmpeg transcode, and a player |
| `game` | `@swiss/game` | Canvas loop. The game server is realtime |
| `chat` | `@swiss/chat` | Message room and a data channel |
| `realtime` | `@swiss/realtime` | Node process (`tsx src/main.ts`). WebSocket at `/ws`, SSE at `/sse/telemetry` and `/sse/media` |

`/api/healthz` reports that the process is alive. `/api/readyz` pings Mongo and Redis when the app uses those services. Marketing only has `healthz`.

### `libs/`

| Folder | Package | What it does |
| --- | --- | --- |
| `ui` | `@swiss/ui` | Shell, visible focus, locale switcher, and the TanStack Query provider |
| `contracts` | `@swiss/contracts` | Zod schemas, the OpenAPI spec, and the HTTP client. The `./api` entry is the client the apps call |
| `auth-client` | `@swiss/auth-client` | Better Auth client (`./browser`) and server-side session reads (`./session`) |
| `data-mongo` | `@swiss/data-mongo` | Repositories for products, stories, orders, audit entries, media, and messages |
| `cache-redis` | `@swiss/cache-redis` | Cache, token bucket, Pub/Sub, and Streams. A stream envelope carries `requestId`, `traceId`, and `tenantId` |
| `tf-recommend` | `@swiss/tf-recommend` | SKU ranking. The `./browser` entry tries a Web Worker and falls back to a deterministic ranker |
| `observability` | `@swiss/observability` | JSON logs with redaction, metrics, and OpenTelemetry. The `./browser` entry does not load Pino or the SDK |
| `testing-utils` | `@swiss/testing-utils` | Demo data used by the seed and the tests |

### `tools/scripts/`

| File | What it does |
| --- | --- |
| `seed.mjs` | Creates the demo user and the Oficina Norte organization through the auth API |
| `prune.mjs` | Deletes one or more apps and the matching block in `compose.yaml` |
| `eject.mjs` | Copies an app and the `@swiss/*` libraries it depends on into another folder |

### `docker/` and `compose.yaml`

`compose.yaml` starts the infrastructure and, when you ask for them, the app images. The Dockerfiles are `docker/Dockerfile.next`, `docker/Dockerfile.realtime`, and `docker/Dockerfile.streaming`. The streaming image installs ffmpeg.

`docker/otel-collector.yaml`, `docker/tempo.yaml`, and `docker/grafana-datasources.yaml` are read only by the `observability` profile.

### `e2e/` and `docs/`

`e2e/` has three Playwright suites: marketing pages in both languages and two viewports, sign-up through to the ERP, and two chat tabs. `docs/adr/` holds the architecture decisions.

## Commands

From the repo root:

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs the workspace |
| `pnpm codegen` | Generates OpenAPI and the Orval client |
| `pnpm dev` | Starts every `dev` target in parallel |
| `pnpm build` | Builds projects through Nx, in dependency order |
| `pnpm test` | Runs Vitest in each project. It does not run Playwright |
| `pnpm lint` | ESLint, including the module-boundary rule |
| `pnpm seed` | Calls auth and creates the demo account |
| `pnpm prune commerce` | Same as `node tools/scripts/prune.mjs commerce` |
| `pnpm eject auth ejected/auth` | Same as `node tools/scripts/eject.mjs auth ejected/auth` |

One package:

```bash
pnpm --filter @swiss/marketing dev
pnpm --filter @swiss/gateway build
pnpm --filter @swiss/e2e test
```

The marketing Playwright project starts that app itself. The ERP spec expects auth at `AUTH_URL`. The WebRTC spec expects `http://127.0.0.1:3009/health`. When those processes are down, the matching tests are skipped.

The Redis tests in `libs/cache-redis` are also skipped when neither `REDIS_URL` nor a `redis-server` binary is on `PATH`. The Mongo test starts an in-memory replica set and does not need Docker.

## Compose profiles

A service starts when one of the profiles you asked for is in its list.

| Profile | What it includes |
| --- | --- |
| `nosql` | MongoDB as a one-node replica set, port 27017 |
| `cache` | Redis, port 6379 |
| `core-apps` | Mongo, Redis, gateway, and auth |
| `commerce-erp` | Mongo, Redis, commerce, and erp |
| `realtime` | Redis, realtime, chat, and game |
| `media-industrial` | Redis, realtime, streaming, and industrial |
| `marketing` | The marketing image only |
| `observability` | Collector on 4318, Tempo, Loki on 3100, and Grafana on 3300 |

`OTEL_ENABLED` starts as `false`. The minimal Compose setup does not wait for a collector.

To see traces and logs locally:

```bash
docker compose --profile observability up -d
```

In `.env`, set `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces`. `GET /api/metrics` answers only when `METRICS_ENABLED=true` and the `x-metrics-key` header equals `METRICS_TOKEN`.

## Three ways to use it

### Landing

This path does not need Mongo or Redis.

```bash
pnpm --filter @swiss/marketing dev
```

Open `http://localhost:3002/pt-BR`. The story is `/pt-BR/stories/prensa-hidraulica` and the contact form is `/pt-BR/contact`. Without the gateway, the story says the content is unavailable. With the gateway and Mongo, the same route reads the published story.

To keep only that app on disk:

```bash
pnpm prune gateway auth commerce erp industrial streaming game chat realtime
```

`prune` deletes folders and sections of `compose.yaml`. Run it on a copy if you still want the full monorepo.

### Store and ERP

```bash
docker compose --profile nosql --profile cache up -d
pnpm --filter @swiss/auth dev
pnpm --filter @swiss/gateway dev
pnpm --filter @swiss/commerce dev
pnpm --filter @swiss/erp dev
pnpm seed
```

The `core-apps` and `commerce-erp` profiles start the images for those four apps. Use one path. Using both at once fights over ports 3000, 3001, 3003, and 3004.

1. Sign in at `http://localhost:3001/pt-BR/sign-in`, or create the account at `/pt-BR/sign-up`.
2. At `/pt-BR/organization`, create the organization and set it active. Its id is the tenant.
3. The catalog is at `http://localhost:3003/pt-BR`. Checkout sends the order to the gateway, which publishes `order.placed`.
4. `http://localhost:3004/pt-BR` lists the tenant's orders and the audit trail for whoever is allowed to read it.
5. The HTTP contract is at `http://localhost:3000/pt-BR/docs`.

### Chat and game

```bash
docker compose --profile cache up -d
pnpm --filter @swiss/realtime dev
pnpm --filter @swiss/chat dev
pnpm --filter @swiss/game dev
```

The `realtime` profile starts the realtime, chat, and game images. Do not combine it with the three `pnpm dev` commands above.

Chat is at `http://localhost:3008/pt-BR`. Two tabs in the same room exchange messages over the WebSocket and can open a data channel. The game is at `http://localhost:3007/pt-BR`. The arrow keys send a step to realtime, which returns the position. Press telemetry is published at `http://localhost:3009/sse/telemetry?machineId=press-1`, and the industrial dashboard on port 3005 consumes that stream.

## Prune and eject

`pnpm prune commerce` removes `apps/commerce`, `libs/tf-recommend`, and the `commerce` service from Compose. For any other name, the script removes `apps/<name>` and the `# service:<name>` block in Compose. The only exclusive library mapped today is `tf-recommend`.

`pnpm eject auth ejected/auth` creates another folder with `apps/auth`, every `@swiss/*` library the `package.json` graph reaches (today `auth-client`, `ui`, and `observability`), and a `compose.yaml` that contains only Mongo. It deletes the destination if that folder already exists. Inside the new folder, run `pnpm install` and `docker compose up -d`.

Both commands change files. Do not run them in your only checkout if you only want to try them.
