import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';
import 'package:dio/dio.dart';

class RegisterResult {
  final String message;
  final String? accessToken;
  final String? refreshToken;

  const RegisterResult({
    required this.message,
    this.accessToken,
    this.refreshToken,
  });

  bool get hasTokens => accessToken != null && refreshToken != null;
}

class RegisterRepository {
  RegisterRepository({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;

  String? _readToken(
    Map<String, dynamic> data,
    String snakeKey,
    String camelKey,
  ) {
    final value = data[snakeKey] ?? data[camelKey];
    return value is String ? value : null;
  }

  Future<RegisterResult> register({
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

    final data = response.data as Map<String, dynamic>? ?? const {};

    return RegisterResult(
      message: data['message'] as String? ?? 'Cadastro realizado com sucesso.',
      accessToken: _readToken(data, 'access_token', 'accessToken'),
      refreshToken: _readToken(data, 'refresh_token', 'refreshToken'),
    );
  }
}

class InvalidRegistrationCityException implements Exception {
  const InvalidRegistrationCityException();
}
