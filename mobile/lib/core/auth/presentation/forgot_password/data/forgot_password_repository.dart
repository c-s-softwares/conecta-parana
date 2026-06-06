import 'package:dio/dio.dart';
import 'package:conectaparana/core/network/api_client.dart';

enum ForgotPasswordError { invalidOrExpiredCode, weakPassword, unknown }

class ForgotPasswordException implements Exception {
  final ForgotPasswordError type;
  const ForgotPasswordException(this.type);
}

class ForgotPasswordRepository {
  final ApiClient _client;

  ForgotPasswordRepository({ApiClient? client})
    : _client = client ?? ApiClient.instance;

  Future<void> forgotPassword({required String email}) async {
    await _client.dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    try {
      await _client.dio.post(
        '/auth/reset-password',
        data: {'email': email, 'code': code, 'password': newPassword},
      );
    } on DioException catch (e) {
      final errorCode = e.response?.data?['code'];

      if (errorCode == 'invalid_or_expired_code') {
        throw const ForgotPasswordException(
          ForgotPasswordError.invalidOrExpiredCode,
        );
      }
      if (errorCode == 'weak_password') {
        throw const ForgotPasswordException(ForgotPasswordError.weakPassword);
      }

      throw const ForgotPasswordException(ForgotPasswordError.unknown);
    }
  }
}