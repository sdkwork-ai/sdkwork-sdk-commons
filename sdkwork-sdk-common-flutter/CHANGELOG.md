# Changelog

## 1.1.0

- Add `src/utils/sdk_response.dart`: domain-free navigation for the canonical
  SDKWork response envelope (`data.items`, `data.item`, `data.pageInfo`), so
  authored packages decode generated responses without re-walking maps.
- Add `src/utils/random_id.dart`: `generateSecureHexId` for client-supplied
  deduplication ids.

## 1.0.0

- Initial SDKwork Flutter common package release.
