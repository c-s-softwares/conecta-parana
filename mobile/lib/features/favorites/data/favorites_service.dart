import 'package:conectaparana/core/network/api_client.dart';

import 'favorite_item_model.dart';

class FavoritesService {
  FavoritesService({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient.instance;

  final ApiClient _apiClient;

  Future<List<FavoriteItemModel>> getMyFavorites() async {
    final response = await _apiClient.dio.get('/saves/me');

    final data = response.data;

    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(FavoriteItemModel.fromJson)
          .toList();
    }

    if (data is Map<String, dynamic>) {
      return [
        ..._parseSection(data, 'events', FavoriteItemType.event),
        ..._parseSection(data, 'communicates', FavoriteItemType.communicate),
        ..._parseSection(data, 'news', FavoriteItemType.news),
        ..._parseSection(data, 'locals', FavoriteItemType.local),
      ];
    }

    return [];
  }

  List<FavoriteItemModel> _parseSection(
    Map<String, dynamic> data,
    String key,
    FavoriteItemType type,
  ) {
    final value = data[key];

    if (value is! List) {
      return [];
    }

    return value
        .whereType<Map<String, dynamic>>()
        .map((item) => FavoriteItemModel.fromJson(item, fallbackType: type))
        .toList();
  }
}
