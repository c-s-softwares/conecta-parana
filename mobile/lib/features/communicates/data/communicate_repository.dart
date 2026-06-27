import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'communicate_detail_model.dart';

class CommunicateRepository {
  final Dio _dio;

  CommunicateRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  Future<CommunicateDetailModel> getById(String id) async {
    final response = await _dio.get('/communicates/$id');

    return CommunicateDetailModel.fromJson(response.data);
  }
}