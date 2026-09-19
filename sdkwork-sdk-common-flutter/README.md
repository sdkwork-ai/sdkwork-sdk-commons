# sdkwork_common_flutter

Common Flutter/Dart foundation package for generated SDKs.

## Install

```yaml
dependencies:
  sdkwork_common_flutter: ^1.1.0
```

## Authentication Modes

Use one mode per client instance.

1. API Key mode
- `Authorization: Bearer {apiKey}` (or custom API key header)

2. Dual-token mode
- `Access-Token: {accessToken}`
- `Authorization: Bearer {authToken}`

## Quick Start

```dart
import 'package:sdkwork_common_flutter/sdkwork_common_flutter.dart';

final client = BaseHttpClient(
  const SdkConfig(
    baseUrl: 'https://api.example.com',
    accessToken: 'your-access-token',
    authToken: 'your-auth-token',
  ),
);

final profile = await client.get('/v1/profile');
print(profile);
```

API key mode example:

```dart
final client = BaseHttpClient(
  const SdkConfig(
    baseUrl: 'https://api.example.com',
    apiKey: 'your-api-key',
  ),
);
```

## Response Envelope

Every SDKWORK OpenAPI surface wraps its payload in a canonical envelope:

- list -> `{"data": {"items": [...], "pageInfo": {...}}}`
- single -> `{"data": {"item": {...}}}`

Generated clients erase the concrete element type of `items` and `item`, so use
the envelope helpers instead of re-walking maps in each package:

```dart
import 'package:sdkwork_common_flutter/sdkwork_common_flutter.dart';

final items = decodeEnvelopeItems(response.data, MyModel.fromJson);
final single = decodeEnvelopeItem(response.data, MyModel.fromJson);
final pageInfo = readEnvelopePageInfo(response.data);
final raw = asJsonMap(response.data);
```

Model construction stays in the consuming package; these helpers only navigate
the envelope shape.

## Client Ids

Idempotent write APIs bind a client-supplied id as their deduplication key:

```dart
final clientMessageId = generateSecureHexId(prefix: 'flutter');
final conversationId = generateSecureHexId(prefix: 'direct');
```

## Exports

- `SdkConfig`
- `BaseHttpClient`
- `asJsonMap`, `readEnvelopeData`, `readEnvelopePageInfo`, `readEnvelopeItem`,
  `readEnvelopeItems`, `decodeEnvelopeItems`, `decodeEnvelopeItem`
- `generateSecureHexId`, `secureIdByteLength`


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

> Ensure `dart pub publish --dry-run` passes before release publish.

## License

MIT

## SDKWork Documentation Contract

Domain: platform
Capability: common
Package type: flutter-package
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

- `powershell -NoProfile -Command "Get-Content specs/component.spec.json -Raw | ConvertFrom-Json | Out-Null"`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
