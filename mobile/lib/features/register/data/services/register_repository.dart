import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:dio/dio.dart';

class RegisterRepository {
  RegisterRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;

  Future<({String? accessToken, String? refreshToken})> register({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String cityId,
  }) async {
    final normalizedCityId = cityId.trim();
    if (!City.isValidBackendId(normalizedCityId)) {
      throw const InvalidRegistrationCityException();
    }

    final response = await _dio.post(
      '/auth/register',
      data: {
        'name': name,
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'cityId': normalizedCityId,
      },
    );

    final data = response.data;
    return (
      accessToken: data is Map ? data['accessToken'] as String? : null,
      refreshToken: data is Map ? data['refreshToken'] as String? : null,
    );
  }

  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    await ApiClient.instance.dio.post(
      '/auth/verify-email',
      data: {'email': email, 'code': code},
    );
  }

  Future<void> resendVerification({required String email}) async {
    await ApiClient.instance.dio.post(
      '/auth/resend-verification',
      data: {'email': email},
    );
  }

  Future<({String accessToken, String refreshToken})> login({
    required String email,
    required String password,
  }) async {
    final response = await ApiClient.instance.dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );

    final data = response.data as Map;

    final tokens = (data['tokens'] is Map) ? data['tokens'] as Map : data;

    final access = (tokens['accessToken'] ?? tokens['access_token']) as String?;
    final refresh =
        (tokens['refreshToken'] ?? tokens['refresh_token']) as String?;

    if (access == null || refresh == null) {
      throw StateError('Login não retornou tokens. Resposta: $data');
    }

    return (accessToken: access, refreshToken: refresh);
  }
}

class InvalidRegistrationCityException implements Exception {
  const InvalidRegistrationCityException();
}
