import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';

enum SearchResultType { locals, news, events, communicates }

class SearchResultItem {
  const SearchResultItem({
    required this.id,
    required this.types,
    required this.title,
    required this.detailRoute,
    this.description,
    this.category,
    this.address,
    this.date,
  });

  final String id;
  final SearchResultType types;
  final String title;
  final String detailRoute;
  final String? description;
  final String? category;
  final String? address;
  final DateTime? date;
}

class SearchResultPage {
  const SearchResultPage({required this.items, required this.total});

  final List<SearchResultItem> items;
  final int total;
}

class SearchRepository {
  SearchRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;

  Future<SearchResultPage> search({
    required String query,
    String? cityId,
    SearchResultType? types,
    int limit = 10,
  }) async {
    final normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      return const SearchResultPage(items: [], total: 0);
    }

    final response = await _dio.get<Map<String, dynamic>>(
      '/search',
      queryParameters: {
        'q': normalizedQuery,
        'limit': limit,
        if (cityId != null && cityId.trim().isNotEmpty) 'cityId': cityId.trim(),
        if (types != null) 'types': _apiType(types),
      },
    );

    final data = response.data ?? const <String, dynamic>{};
    final items = <SearchResultItem>[];
    var total = 0;

    void appendGroup(String key, SearchResultType types) {
      final group = data[key];
      if (group is! Map<String, dynamic>) return;
      final rawItems = group['items'] as List<dynamic>? ?? const [];
      total += group['total'] as int? ?? rawItems.length;
      items.addAll(
        rawItems.whereType<Map<String, dynamic>>().map(
          (json) => _mapItem(types, json),
        ),
      );
    }

    appendGroup('locals', SearchResultType.locals);
    appendGroup('news', SearchResultType.news);
    appendGroup('events', SearchResultType.events);
    appendGroup('communicates', SearchResultType.communicates);

    return SearchResultPage(items: items, total: total);
  }

  static String _apiType(SearchResultType types) => switch (types) {
    SearchResultType.locals => 'locals',
    SearchResultType.news => 'news',
    SearchResultType.events => 'events',
    SearchResultType.communicates => 'communicates',
  };

  static SearchResultItem _mapItem(
    SearchResultType types,
    Map<String, dynamic> json,
  ) {
    final id = json['id']?.toString() ?? '';
    final title = types == SearchResultType.locals
        ? json['name']?.toString() ?? ''
        : json['title']?.toString() ?? '';
    final route = switch (types) {
      SearchResultType.locals => '/map/$id',
      SearchResultType.news => '/home/news/$id',
      SearchResultType.events => '/events/$id',
      SearchResultType.communicates => '/home/comunicado/$id',
    };

    return SearchResultItem(
      id: id,
      types: types,
      title: title,
      detailRoute: route,
      description: json['description'] as String?,
      category: json['types'] as String?,
      address: json['address'] as String?,
      date: DateTime.tryParse(
        (json['eventDate'] ?? json['createdAt'] ?? '').toString(),
      ),
    );
  }
}
