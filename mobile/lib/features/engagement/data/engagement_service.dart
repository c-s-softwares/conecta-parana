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
        data: {_targetKey(entityType): entityId},
        options: Options(extra: {'auth': true}),
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
        '/saves/toggle',
        data: {_targetKey(entityType): entityId},
        options: Options(extra: {'auth': true}),
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw EngagementException('Conteúdo não encontrado.');
      }

      throw EngagementException('Sem conexão. Tente novamente.');
    }
  }

  String _targetKey(String entityType) {
    return switch (entityType) {
      'event' => 'eventId',
      'communicate' => 'communicateId',
      'news' => 'newsId',
      'local' => 'localId',
      _ => throw EngagementException('Tipo de conteúdo inválido.'),
    };
  }
}
