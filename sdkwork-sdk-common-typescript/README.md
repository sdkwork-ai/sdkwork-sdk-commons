# @sdkwork/sdk-common

Common foundation package for generated TypeScript SDKs.

## Install

```bash
npm install @sdkwork/sdk-common
```

## Authentication Modes

Choose one mode per client instance.

1. API Key mode
- `Authorization: Bearer {apiKey}`

2. Dual-token mode
- `Access-Token: {accessToken}`
- `Authorization: Bearer {authToken}`

## Quick Start

```typescript
import { createBaseHttpClient, createTokenManager } from '@sdkwork/sdk-common';

const tokenManager = createTokenManager({
  accessToken: 'your-access-token',
  authToken: 'your-auth-token',
});

const client = createBaseHttpClient({
  baseUrl: 'https://api.example.com',
  tokenManager,
});

const profile = await client.get<{ id: string; name: string }>('/v1/profile');
console.log(profile.name);
```

API key mode example:

```typescript
import { createBaseHttpClient } from '@sdkwork/sdk-common';

const client = createBaseHttpClient({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
});
```

## Exported Modules

- `core`: request/result types, constants, retry/cache/logger config types
- `auth`: token manager and auth header builder
- `http`: `BaseHttpClient` and `createBaseHttpClient`
- `errors`: SDK error hierarchy and type guards
- `utils`: retry, cache, logger, string/encoding/date/object helpers

## Base URL Resolution (`resolveBaseUrl`)

`resolveBaseUrl` is the single browser/runtime implementation of the SDKwork
base-URL lifecycle matrix (`ENVIRONMENT_SPEC.md` §6.3 / §5.1.4.0 / §6.2.1).
All H5, PC web, desktop renderer, and mini-program surfaces must construct
SDK client base origins through it instead of hand-rolled env chains or host
rewriting.

```typescript
import { resolveBaseUrl } from '@sdkwork/sdk-common';

const runtime = resolveBaseUrl(); // reads SDKWORK_API_BASE_URL by default
const origin = runtime.url;       // bare origin; append /app/v3/api etc. per surface
```

Behavior:

- Reads the unified `SDKWORK_API_BASE_URL` key (or `options.envKey`); the value
  may hold several candidate origins separated by commas or semicolons.
- Selects the candidate matching the current page host's environment
  (`-dev` / `-test` / `-staging` suffix, none = production), brand, and
  deployment mode (`SDKWORK_DEPLOYMENT_PROFILE` / `VITE_SDKWORK_DEPLOYMENT_PROFILE`,
  `cloud` | `standalone`, default `cloud`), preferring the page protocol.
- Derives the origin from the page host when no candidate matches:
  - built cloud: `im.sdkwork.com` → `api.sdkwork.com`,
    `im-dev.sdkwork.com` → `api-dev.sdkwork.com`
  - built standalone: same origin as the page
  - `pnpm dev` standalone: same-origin ip+port of the dev server
  - `pnpm dev` cloud: the local `sdkwork-api-cloud-gateway` dev port
    (`CLOUD_GATEWAY_DEV_PORT`, `3910`; override `SDKWORK_API_DEV_PORT`)
- Mini-programs / desktop runtimes without `window.location` pass
  `{ hostname, protocol, port }` explicitly; the matrix is identical.
- Returns `{ url, reason, mode, environment, host }`; `reason` ∈
  `current-host-match` | `development-local-candidate` | `derived-from-host`
  | `fallback-first` | `empty` (never throws).

Compliance gate for the workspace:
`node sdkwork-specs/tools/check-base-url-resolution.mjs --workspace <root>`.

## Publishing

This SDK includes cross-platform publish scripts in `bin/`:
- `bin/publish-core.mjs`
- `bin/publish.sh`
- `bin/publish.ps1`

### Check

```bash
./bin/publish.sh --action check
```

### Publish

```bash
./bin/publish.sh --action publish --channel release
```

```powershell
.\bin\publish.ps1 --action publish --channel test --dry-run
```

> Set `NPM_TOKEN` (and optional `NPM_REGISTRY_URL`) before release publish.

## License

MIT

## SDKWork Documentation Contract

Domain: platform
Capability: sdk-common
Package type: node-package
Status: standard

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
