import 'package:dio/dio.dart';

class EngagementException implements Exception {
  EngagementException(this.message);

  final String message;
}

class EngagementService {
  EngagementService(this._dio);

  final Dio _dio;

  Future<void> toggleLike({
    required String entityType,
    required String entityId,
  }) async {
    try {
      await _dio.post(
        '/likes/toggle',
        data: {'entityType': entityType, 'entityId': entityId},
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw EngagementException('Conteúdo não encontrado.');
      }

      throw EngagementException('Sem conexão. Tente novamente.');
    }
  }

  Future<void> toggleFavorite({
    required String entityType,
    required String entityId,
  }) async {
    try {
      await _dio.post(
        '/favorites/toggle',
        data: {'entityType': entityType, 'entityId': entityId},
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw EngagementException('Conteúdo não encontrado.');
      }

      throw EngagementException('Sem conexão. Tente novamente.');
    }
  }
}
