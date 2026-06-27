import 'package:dio/dio.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:flutter/foundation.dart';

enum ForgotPasswordError { invalidOrExpiredCode, weakPassword, unknown }

class ForgotPasswordException implements Exception {
  final ForgotPasswordError type;
  const ForgotPasswordException(this.type);
}

abstract class ForgotPasswordRepository {
  Future<void> forgotPassword({required String email});
  Future<void> verifyCode({required String email, required String code});
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  });

  factory ForgotPasswordRepository.create() {
    return ForgotPasswordRepositoryMock();
  }
}

class ForgotPasswordRepositoryImpl implements ForgotPasswordRepository {
  final ApiClient _client;

  ForgotPasswordRepositoryImpl({ApiClient? client})
    : _client = client ?? ApiClient.instance;

  @override
  Future<void> forgotPassword({required String email}) async {
    await _client.dio.post('/auth/forgot-password', data: {'email': email});
  }

  @override
  Future<void> verifyCode({required String email, required String code}) async {
    try {
      await _client.dio.post(
        '/auth/verify-code',
        data: {'email': email, 'code': code},
      );
    } on DioException catch (e) {
      _handleError(e);
    }
  }

  @override
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
      _handleError(e);
    }
  }

  void _handleError(DioException e) {
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

class ForgotPasswordRepositoryMock implements ForgotPasswordRepository {
  static const _mockCode = '123456';

  @override
  Future<void> forgotPassword({required String email}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    debugLog(
      '📧 [MOCK] Código de reset enviado para $email → código: $_mockCode',
    );
  }

  @override
  Future<void> verifyCode({required String email, required String code}) async {
    await Future.delayed(const Duration(milliseconds: 300));
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
    debugLog('🔑 [MOCK] Senha redefinida para $email');
  }

  void debugLog(String message) {
    assert(() {
      debugPrint(message);
      return true;
    }());
  }
}
