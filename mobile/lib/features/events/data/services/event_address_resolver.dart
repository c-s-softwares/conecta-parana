import 'package:dio/dio.dart';

class EventAddressResolver {
  final Dio _dio;
  final Map<String, String> _cache = {};

  EventAddressResolver(this._dio);

  Future<Map<String, String>> resolve(
    Iterable<Map<String, dynamic>> events,
  ) async {
    final localIds = events
        .map((event) => event['localId'])
        .whereType<String>()
        .map((id) => id.trim())
        .where((id) => id.isNotEmpty)
        .toSet();

    final missingIds = localIds.where((id) => !_cache.containsKey(id));
    await Future.wait(missingIds.map(_loadAddress));

    final result = <String, String>{};
    for (final id in localIds) {
      final address = _cache[id];
      if (address != null) result[id] = address;
    }
    return result;
  }

  String addressFor(
    Map<String, dynamic> event,
    Map<String, String> addresses,
  ) {
    final local = event['local'];
    if (local is Map<String, dynamic>) {
      final address = _nonEmptyString(local['address']);
      if (address != null) return address;
    }

    final directAddress = _nonEmptyString(event['address']);
    if (directAddress != null) return directAddress;

    final localId = _nonEmptyString(event['localId']);
    if (localId == null) return 'Local a definir';
    return addresses[localId] ?? 'Local a definir';
  }

  Future<void> _loadAddress(String localId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/locals/$localId');
      final address = _nonEmptyString(response.data?['address']);
      if (address != null) _cache[localId] = address;
    } on DioException {
      // A falha de um local não deve impedir a listagem dos eventos.
    }
  }

  String? _nonEmptyString(dynamic value) {
    if (value is! String) return null;
    final normalized = value.trim();
    return normalized.isEmpty ? null : normalized;
  }
}
