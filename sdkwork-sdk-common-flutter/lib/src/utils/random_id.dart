import 'dart:math';

/// Number of random bytes backing a generated id (128 bits).
const int secureIdByteLength = 16;

/// Generates a collision-resistant `<prefix>-<lowercase hex>` identifier.
///
/// Idempotent write APIs bind a client-supplied id as their deduplication key,
/// so ids must never collide across retries, peers, or devices. Wall-clock and
/// `hashCode` schemes can collide for two writes inside the same millisecond;
/// a cryptographically strong random value cannot in practice.
///
/// [prefix] names the id space, for example `flutter` for client message ids
/// and `direct` for client conversation ids.
String generateSecureHexId({
  required String prefix,
  int byteLength = secureIdByteLength,
}) {
  if (byteLength <= 0) {
    throw ArgumentError.value(byteLength, 'byteLength', 'must be positive');
  }
  final random = Random.secure();
  final bytes = List<int>.generate(byteLength, (_) => random.nextInt(256));
  final hex = bytes
      .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
      .join();
  return '$prefix-$hex';
}
