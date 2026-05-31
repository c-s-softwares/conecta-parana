import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';

import '../models/feed_item_model.dart';
import '../../domain/entities/feed_page.dart';
import '../../domain/repositories/feed_repository.dart';

class FeedRepositoryImpl implements FeedRepository {
  final Dio _dio;

  FeedRepositoryImpl({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

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
        'limit': limit.clamp(1, 50),
        // ignore: use_null_aware_elements
        if (lat != null) 'lat': lat,
        // ignore: use_null_aware_elements
        if (lng != null) 'lng': lng,
        // ignore: use_null_aware_elements
        if (cursor != null) 'cursor': cursor,
      };

      final response = await _dio.get<Map<String, dynamic>>(
        '/feed',
        queryParameters: queryParams,
      );

      final data = response.data!;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final items = rawItems
          .map((e) => FeedItemModel.fromJson(e as Map<String, dynamic>).toDomain())
          .toList();

      return FeedPage(
        items: items,
        nextCursor: data['nextCursor'] as String?,
        hasMore: data['hasMore'] as bool? ?? data['nextCursor'] != null,
      );
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final errorCode = e.response?.data?['code'] as String?;

      if (statusCode == 400 && errorCode == 'city_required') {
        throw const FeedCityRequiredException();
      }

      if (statusCode == 400 && errorCode == 'invalid_cursor') {
        throw const FeedInvalidCursorException();
      }

      throw const FeedNetworkException();
    } catch (_) {
      throw const FeedNetworkException();
    }
  }
}