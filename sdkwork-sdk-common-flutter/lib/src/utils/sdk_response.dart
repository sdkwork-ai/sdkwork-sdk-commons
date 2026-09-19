/// Domain-free navigation helpers for the SDKWork HTTP response envelope.
///
/// Every SDKWORK OpenAPI surface wraps its payload in a canonical envelope:
///
/// * list   -> `{"data": {"items": [...], "pageInfo": {...}}}`
/// * single -> `{"data": {"item": {...}}}`
///
/// Generated clients erase the concrete element type of `items` and `item`, so
/// authored packages walk the envelope through these helpers instead of
/// re-implementing the same map handling. Model construction stays in the
/// consuming package.
library;

/// Returns [value] as a `Map<String, dynamic>`, or `null` when it is not a map.
///
/// Decoded JSON objects are not guaranteed to be typed as
/// `Map<String, dynamic>` at every nesting level, so callers normalize before
/// indexing by key.
Map<String, dynamic>? asJsonMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return null;
}

/// Reads the `data` object from a list or single-resource envelope.
Map<String, dynamic>? readEnvelopeData(dynamic data) => asJsonMap(data);

/// Reads the raw `data.pageInfo` object from a list envelope.
Map<String, dynamic>? readEnvelopePageInfo(dynamic data) =>
    asJsonMap(asJsonMap(data)?['pageInfo']);

/// Reads the raw `data.item` object from a single-resource envelope.
Map<String, dynamic>? readEnvelopeItem(dynamic data) =>
    asJsonMap(asJsonMap(data)?['item']);

/// Reads the raw `data.items` objects from a list envelope.
///
/// Values that are not maps are dropped rather than raising, so a partially
/// shaped payload degrades to a shorter or empty window instead of failing the
/// whole screen.
List<Map<String, dynamic>> readEnvelopeItems(dynamic data) {
  final rawItems = asJsonMap(data)?['items'];
  if (rawItems is! Iterable) {
    return <Map<String, dynamic>>[];
  }
  return rawItems
      .map(asJsonMap)
      .whereType<Map<String, dynamic>>()
      .toList(growable: false);
}

/// Decodes `data.items[]` into models through [decode].
List<T> decodeEnvelopeItems<T>(
  dynamic data,
  T Function(Map<String, dynamic> json) decode,
) {
  return readEnvelopeItems(data).map(decode).toList(growable: false);
}

/// Decodes `data.item` into a model through [decode].
T? decodeEnvelopeItem<T>(
  dynamic data,
  T Function(Map<String, dynamic> json) decode,
) {
  final itemMap = readEnvelopeItem(data);
  return itemMap == null ? null : decode(itemMap);
}
