import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:conectaparana/features/events/data/services/event_address_resolver.dart';
import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';
import 'package:conectaparana/features/favorites/data/favorites_change_notifier.dart';
import 'package:dio/dio.dart';

class EventNotFoundException implements Exception {}

class EventNetworkException implements Exception {}

class EngagementResult {
  final bool active;
  final int? count;

  const EngagementResult({required this.active, this.count});
}

class EventListPage {
  final List<EventListItem> items;
  final int total;
  final int page;
  final int pageSize;

  const EventListPage({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  bool get hasMore => page * pageSize < total;
}

abstract class EventRepository {
  Future<EventListPage> getEvents({
    String? cityId,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 10,
  });

  Future<EventDetail> getEvent(String id);
  Future<EngagementResult> toggleLike(String id);
  Future<EngagementResult> toggleFavorite(String id);
}

class RemoteEventRepository implements EventRepository {
  final Dio _dio;
  late final EventAddressResolver _addressResolver;

  RemoteEventRepository({ApiClient? client, Dio? dio})
    : _dio = dio ?? (client ?? ApiClient.instance).dio {
    _addressResolver = EventAddressResolver(_dio);
  }

  @override
  Future<EventListPage> getEvents({
    String? cityId,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      final normalizedCityId = cityId?.trim();
      final validCityId =
          normalizedCityId != null && _cityIdPattern.hasMatch(normalizedCityId)
          ? normalizedCityId
          : null;

      final response = await _dio.get<Map<String, dynamic>>(
        '/events',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
          'order': 'date_asc',
          'isActive': true,
          'cityId': ?validCityId,
          'from': ?from?.toIso8601String(),
          'to': ?to?.toIso8601String(),
        },
      );

      final data = response.data;
      if (data == null) throw EventNetworkException();

      final rawItems = (data['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList();
      final addresses = await _addressResolver.resolve(rawItems);
      final items = rawItems
          .map(
            (item) => _eventListItemFromJson(
              item,
              address: _addressResolver.addressFor(item, addresses),
            ),
          )
          .toList();

      return EventListPage(
        items: items,
        total: data['total'] as int? ?? items.length,
        page: data['page'] as int? ?? page,
        pageSize: data['pageSize'] as int? ?? pageSize,
      );
    } on DioException {
      throw EventNetworkException();
    } catch (_) {
      throw EventNetworkException();
    }
  }

  @override
  Future<EventDetail> getEvent(String id) async {
    try {
      final response = await _dio.get(
        '/events/$id',
        options: Options(extra: {'auth': true}),
      );
      return EventDetail.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) throw EventNotFoundException();
      throw EventNetworkException();
    }
  }

  @override
  Future<EngagementResult> toggleLike(String id) async {
    try {
      final response = await _dio.post(
        '/likes/toggle',
        data: {'eventId': id},
        options: Options(extra: {'auth': true}),
      );
      final data = response.data as Map<String, dynamic>;
      return EngagementResult(
        active: data['liked'] as bool? ?? data['active'] as bool? ?? false,
        count: data['likesCount'] as int? ?? data['count'] as int?,
      );
    } on DioException {
      throw EventNetworkException();
    }
  }

  @override
  Future<EngagementResult> toggleFavorite(String id) async {
    try {
      final response = await _dio.post(
        '/saves/toggle',
        data: {'eventId': id},
        options: Options(extra: {'auth': true}),
      );
      final data = response.data as Map<String, dynamic>;
      final result = EngagementResult(
        active: data['saved'] as bool? ?? data['active'] as bool? ?? false,
      );
      favoritesChangeNotifier.notifyChanged();
      return result;
    } on DioException {
      throw EventNetworkException();
    }
  }

  static final RegExp _cityIdPattern = RegExp(
    r'^cit_[0-9A-HJKMNP-TV-Z]{26}$',
    caseSensitive: false,
  );

  EventListItem _eventListItemFromJson(
    Map<String, dynamic> json, {
    required String address,
  }) {
    final id = json['id'] as String;
    final date = DateTime.parse(json['eventDate'] as String);

    return EventListItem(
      id: id,
      title: json['title'] as String? ?? '',
      category: json['type'] as String? ?? 'evento',
      date: date,
      time:
          '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}',
      location: address,
      isFree: false,
      isFeatured: false,
      likesCount: json['likesCount'] as int? ?? 0,
      liked:
          json['liked'] as bool? ??
          json['isLiked'] as bool? ??
          json['likedByMe'] as bool? ??
          false,
      saved:
          json['saved'] as bool? ??
          json['isSaved'] as bool? ??
          json['savedByMe'] as bool? ??
          false,
      detailRoute: '/events/$id',
    );
  }
}
