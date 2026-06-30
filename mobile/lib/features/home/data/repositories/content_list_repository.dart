import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/core/media/media_photo.dart';
import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:dio/dio.dart';

enum ContentListKind { communicates, news }

class ContentListResult {
  const ContentListResult({required this.items, required this.hasMore});
  final List<FeedItem> items;
  final bool hasMore;
}

class ContentListRepository {
  ContentListRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;
  final Dio _dio;

  Future<ContentListResult> load({
    required ContentListKind kind,
    required String? cityId,
    required int page,
    int pageSize = 10,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      kind == ContentListKind.communicates ? '/communicates' : '/news',
      queryParameters: {
        'page': page,
        'pageSize': pageSize,
        'isActive': 'true',
        if (cityId != null && cityId.isNotEmpty) 'cityId': cityId,
      },
    );
    final data = response.data ?? const <String, dynamic>{};
    final raw = (data['items'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final items = raw.map((json) => _mapItem(kind, json)).toList();
    final total = data['total'] as int? ?? items.length;
    return ContentListResult(items: items, hasMore: page * pageSize < total);
  }

  FeedItem _mapItem(ContentListKind kind, Map<String, dynamic> json) {
    final createdAt = DateTime.tryParse(json['createdAt']?.toString() ?? '');
    final photos = MediaPhoto.listFromJson(json['photos']);
    final userMap = json['user'] as Map<String, dynamic>?;
    final authorName =
        userMap?['name'] as String? ?? 'Prefeitura Municipal';
    return FeedItem(
      id: json['id'] as String,
      type: kind == ContentListKind.communicates
          ? FeedItemType.comunicado
          : FeedItemType.news,
      title: json['title'] as String? ?? '',
      authorName: kind == ContentListKind.communicates ? authorName : null,
      subtitle: kind == ContentListKind.communicates
          ? authorName
          : json['description'] as String?,
      category: json['type'] as String?,
      date: createdAt,
      photos: photos,
      imageUrl: photos.firstOrNull?.displayUrl,
    );
  }
}
