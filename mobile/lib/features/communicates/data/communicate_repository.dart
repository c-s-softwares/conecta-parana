import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'communicate_detail_model.dart';

class CommunicateRepository {
  final Dio _dio;

  CommunicateRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  Future<CommunicateDetailModel> getById(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/communicates/$id',
        options: Options(extra: {'auth': true}),
      );
      return CommunicateDetailModel.fromJson(response.data ?? const {});
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        throw CommunicateNotFoundException();
      }
      rethrow;
    }
  }
}

class CommunicateNotFoundException implements Exception {}
