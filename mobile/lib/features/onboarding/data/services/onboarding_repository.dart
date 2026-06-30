import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';

class OnboardingRepository {
  final Dio _dio;

  OnboardingRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  Future<void> updateCity(String cityId) async {
    await _dio.put(
      '/users/me/city',
      data: {'cityId': cityId},
      options: Options(extra: {'auth': true}),
    );
  }

  Future<void> updateNeighborhood(String neighborhood) async {
    await _dio.put(
      '/users/me',
      data: {'neighborhood': neighborhood},
      options: Options(extra: {'auth': true}),
    );
  }
}
