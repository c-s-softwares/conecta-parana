import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:dio/dio.dart';

class EventNotFoundException implements Exception {}

class EventNetworkException implements Exception {}

class EngagementResult {
  final bool active;
  final int? count;

  const EngagementResult({required this.active, this.count});
}

abstract class EventRepository {
  Future<EventDetail> getEvent(String id);
  Future<EngagementResult> toggleLike(String id);
  Future<EngagementResult> toggleFavorite(String id);
}

class RemoteEventRepository implements EventRepository {
  final ApiClient _client;

  RemoteEventRepository({ApiClient? client})
    : _client = client ?? ApiClient.instance;

  @override
  Future<EventDetail> getEvent(String id) async {
    try {
      final response = await _client.dio.get('/events/$id');
      return EventDetail.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) throw EventNotFoundException();
      throw EventNetworkException();
    }
  }

  @override
  Future<EngagementResult> toggleLike(String id) async {
    try {
      final response = await _client.dio.post('/events/$id/like');
      final data = response.data as Map<String, dynamic>;
      return EngagementResult(
        active: data['active'] as bool,
        count: data['count'] as int?,
      );
    } on DioException {
      throw EventNetworkException();
    }
  }

  @override
  Future<EngagementResult> toggleFavorite(String id) async {
    try {
      final response = await _client.dio.post('/events/$id/favorite');
      final data = response.data as Map<String, dynamic>;
      return EngagementResult(active: data['active'] as bool);
    } on DioException {
      throw EventNetworkException();
    }
  }
}
