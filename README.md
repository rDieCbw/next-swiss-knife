# Next Swiss Knife

Clone this repository and start from it. It is not an npm package you add to an existing app.

Each domain is its own process. Shared code lives in `@swiss/*` libraries. Next.js apps do not import one another. They talk through the gateway, over HTTP, or through Redis. The interface languages are `pt-BR` (the default) and `en`. Page routes use that prefix: `/pt-BR/...` and `/en/...`.

The decisions are in [docs/adr/0001-arquitetura-monorepo.md](docs/adr/0001-arquitetura-monorepo.md) and [docs/adr/0002-observabilidade.md](docs/adr/0002-observabilidade.md). There is no CI workflow in this repository. Run the checks below before you adopt it.

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 22 or newer. `.nvmrc` pins 22 |
| pnpm | 10.23.0, through Corepack |
| Docker | Only when the recipe uses MongoDB or Redis |

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.23.0 --activate
node -v
pnpm -v
```

## Install

```bash
cp .env.example .env
pnpm install
pnpm codegen
```

`pnpm codegen` writes `libs/contracts/openapi.json` and the generated client in `libs/contracts/src/generated`. Run it again after a Zod schema changes.

Values in `.env.example`, including `BETTER_AUTH_SECRET` and the demo password, are for local development. Replace them before any shared or production deploy.

## Three ways to run it

Start only the processes that recipe needs. `pnpm dev` at the root starts every app at once.

### Landing

No Mongo and no Redis.

```bash
pnpm --filter @swiss/marketing dev
```

Open `http://localhost:3002/pt-BR`. The story is `/pt-BR/stories/prensa-hidraulica`. The contact form is `/pt-BR/contact`. Without the gateway, the story says the content is unavailable. With the gateway and Mongo, that same route reads the published story.

### Store and ERP

Use four terminals after Mongo and Redis are up.

```bash
docker compose --profile nosql --profile cache up -d
```

```bash
pnpm --filter @swiss/auth dev
```

```bash
pnpm --filter @swiss/gateway dev
```

```bash
pnpm --filter @swiss/commerce dev
```

```bash
pnpm --filter @swiss/erp dev
```

Seed only after auth answers on port 3001:

```bash
pnpm seed
```

The account is `ada@example.com`, password `correct-horse-battery`, organization Oficina Norte. `SEED_EMAIL`, `SEED_PASSWORD`, and `SEED_NAME` override those values.

1. Sign in at `http://localhost:3001/pt-BR/sign-in`, or create the account at `/pt-BR/sign-up`.
2. At `/pt-BR/organization`, create the organization and set it active. Its id is the tenant.
3. The catalog is at `http://localhost:3003/pt-BR`. Checkout sends the order to the gateway, which publishes `order.placed`.
4. `http://localhost:3004/pt-BR` lists that tenant's orders and the audit trail for whoever may read it.
5. The HTTP contract is at `http://localhost:3000/pt-BR/docs`.

The `core-apps` and `commerce-erp` profiles start container images for these apps. Use the images or `pnpm dev`, not both. Together they fight over ports 3000, 3001, 3003, and 3004.

### Chat and game

```bash
docker compose --profile cache up -d
```

Then, in three terminals:

```bash
pnpm --filter @swiss/realtime dev
```

```bash
pnpm --filter @swiss/chat dev
```

```bash
pnpm --filter @swiss/game dev
```

Chat is at `http://localhost:3008/pt-BR`. Two tabs in the same room exchange messages over the WebSocket and can open a data channel. The game is at `http://localhost:3007/pt-BR`. The arrow keys, and the on-screen button, send a step to realtime, which returns the position. Press telemetry is at `http://localhost:3009/sse/telemetry?machineId=press-1`. The industrial dashboard on port 3005 consumes that stream.

The `realtime` profile starts the realtime, chat, and game images. Do not combine it with the three `pnpm dev` commands above.

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
| `pnpm seed` | Calls auth and creates the demo account. Auth must already be up |
| `pnpm prune commerce` | Same as `node tools/scripts/prune.mjs commerce` |
| `pnpm eject auth ejected/auth` | Same as `node tools/scripts/eject.mjs auth ejected/auth` |

One package:

```bash
pnpm --filter @swiss/marketing dev
pnpm --filter @swiss/gateway build
pnpm --filter @swiss/e2e test
```

`pnpm --filter @swiss/e2e test` is Playwright. The marketing project starts that app itself. The ERP spec expects auth at `AUTH_URL`. The WebRTC spec expects `http://127.0.0.1:3009/health`. When those processes are down, the matching tests are skipped.

Vitest for Redis, in `libs/cache-redis`, is skipped when neither `REDIS_URL` nor a `redis-server` binary is on `PATH`. The Mongo test starts an in-memory replica set and does not need Docker.

## Verify before you adopt

```bash
pnpm codegen
pnpm build
pnpm lint
pnpm test
```

There is no GitHub Actions workflow here. A green local run is the check.

To see whether prune leaves a buildable tree, work on a copy:

```bash
cp -R . /tmp/next-swiss-knife-prune
cd /tmp/next-swiss-knife-prune
pnpm prune commerce erp
pnpm install
pnpm build
pnpm lint
```

## Prune and eject

Both commands delete files. Do not run them in your only checkout if you only want to try them.

`pnpm prune commerce` removes `apps/commerce`, `libs/tf-recommend`, and the `commerce` service from Compose. For any other name, the script removes `apps/<name>` and the `# service:<name>` block in Compose. The only exclusive library mapped today is `tf-recommend`.

```bash
pnpm prune gateway auth commerce erp industrial streaming game chat realtime
```

That leaves the marketing app. It also deletes those folders. Keep a copy if you still want the full monorepo.

`pnpm eject auth ejected/auth` creates another folder with `apps/auth`, every `@swiss/*` library the `package.json` graph reaches (today `auth-client`, `ui`, and `observability`), and a `compose.yaml` that contains only Mongo. It deletes the destination if that folder already exists. Inside the new folder:

```bash
pnpm install
docker compose up -d
```

Treat the result as a starting point. Review environment variables and how the app is started before you call it a separate product.

## Where to read first

The pieces that shape the rest of the repo:

- [apps/gateway](apps/gateway) for the BFF, tenant check, and OpenAPI surface
- [apps/auth](apps/auth) for Better Auth and the session
- [libs/contracts](libs/contracts) for Zod schemas and the generated HTTP client
- [libs/ui](libs/ui) for the shared shell, locale switch, and focus styles

Streaming, the canvas game, chat with WebRTC, and the industrial dashboard are vertical examples. Confirm the path you need with `pnpm build` and the matching Playwright spec before you depend on it.

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

## Folders

### `apps/`

One directory, one process.

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

`/api/healthz` reports that the process is alive. `/api/readyz` pings Mongo and Redis when that app uses those services. Marketing only has `healthz`. Chat, game, commerce, and industrial are ready when the process is up, because they do not open those databases themselves.

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

### `docker/`, `e2e/`, and `docs/`

`compose.yaml` starts infrastructure and, when you ask for them, the app images. The Dockerfiles are `docker/Dockerfile.next`, `docker/Dockerfile.realtime`, and `docker/Dockerfile.streaming`. The streaming image installs ffmpeg. `docker/otel-collector.yaml`, `docker/tempo.yaml`, and `docker/grafana-datasources.yaml` are read only by the `observability` profile.

A service starts when one of the profiles you pass is in its list.

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

`OTEL_ENABLED` starts as `false`. The minimal Compose setup does not wait for a collector. To inspect traces locally, run `docker compose --profile observability up -d`, then set `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces`. `GET /api/metrics` answers only when `METRICS_ENABLED=true` and the `x-metrics-key` header equals `METRICS_TOKEN`.

`e2e/` has three Playwright suites: marketing pages in both languages and two viewports, sign-up through to the ERP, and two chat tabs. `docs/adr/` holds the architecture decisions.
