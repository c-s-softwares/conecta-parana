import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/events/data/services/event_address_resolver.dart';
import 'package:dio/dio.dart';

import '../models/feed_item_model.dart';
import '../../domain/entities/feed_page.dart';
import '../../domain/repositories/feed_repository.dart';

class FeedRepositoryImpl implements FeedRepository {
  final Dio _dio;
  late final EventAddressResolver _addressResolver;

  FeedRepositoryImpl({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio {
    _addressResolver = EventAddressResolver(_dio);
  }

  @override
  Future<FeedPage> getFeed({
    required String cityId,
    double? lat,
    double? lng,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'cityId': cityId,
        // ignore: use_null_aware_elements
        if (lat != null) 'lat': lat,
        // ignore: use_null_aware_elements
        if (lng != null) 'lng': lng,
      };

      final responses = await Future.wait([
        _dio.get<Map<String, dynamic>>('/feed', queryParameters: queryParams),
        _dio.get<Map<String, dynamic>>(
          '/categories',
          queryParameters: const {'page': 1, 'pageSize': 8},
        ),
      ]);

      final feedData = responses[0].data;
      final categoriesData = responses[1].data;
      if (feedData == null) throw const FeedNetworkException();

      final rawEvents = (feedData['events'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList();
      final addresses = await _addressResolver.resolve(rawEvents);
      final mappedFeedData = Map<String, dynamic>.from(feedData)
        ..['events'] = [
          for (final event in rawEvents)
            {
              ...event,
              'address': _addressResolver.addressFor(event, addresses),
            },
        ];

      final rawCategories = categoriesData?['items'] as List<dynamic>? ?? [];
      final categories = rawCategories
          .whereType<Map<String, dynamic>>()
          .toList();

      return FeedResponseModel.fromJson(
        mappedFeedData,
        categories: categories,
      ).toDomain();
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final errorCode = e.response?.data?['code'] as String?;

      if (statusCode == 400 &&
          (errorCode == 'city_required' || errorCode == 'validation_failed')) {
        throw const FeedCityRequiredException();
      }

      if (statusCode == 404 && errorCode == 'city_not_found') {
        throw const FeedCityRequiredException();
      }

      throw const FeedNetworkException();
    } catch (_) {
      throw const FeedNetworkException();
    }
  }
}
