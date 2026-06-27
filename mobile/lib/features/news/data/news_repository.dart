import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import 'news_detail_model.dart';

class NewsRepository {
  final ApiClient _apiClient;

  NewsRepository(this._apiClient);

  Future<NewsDetailModel> getById(String id) async {
    try {
      final response = await _apiClient.dio.get('/news/$id');

      return NewsDetailModel.fromJson(response.data);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        throw NewsNotFoundException();
      }

      rethrow;
    }
  }
}

class NewsNotFoundException implements Exception {}
