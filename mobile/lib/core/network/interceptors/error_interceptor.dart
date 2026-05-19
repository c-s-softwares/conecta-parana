import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:conectaparana/core/auth/auth_service.dart';

class ErrorInterceptor extends Interceptor {
  final GlobalKey<NavigatorState>? navigatorKey;
  final void Function(String message)? onShowMessage;
  final AuthService auth;

  ErrorInterceptor({
    this.navigatorKey,
    this.onShowMessage,
    AuthService? authService,
  }) : auth = authService ?? AuthService.instance;

  void _showSnackBar(String message) {
    if (onShowMessage != null) {
      onShowMessage!(message);
      return;
    }

    final context = navigatorKey?.currentContext;
    if (context == null) return;

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  bool _isValidationError(DioException err) {
    return err.response?.statusCode == 400 &&
        err.response?.data?['code'] == 'validation_failed';
  }

  bool _isNetworkError(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.connectionError;
  }

  bool _isGetRequest(RequestOptions options) {
    return options.method.toUpperCase() == 'GET';
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;
    final request = err.requestOptions;

    if (_isNetworkError(err)) {
      _showSnackBar('Sem conexão com o servidor.');
      return handler.next(err);
    }

    if (_isValidationError(err)) {
      return handler.next(err);
    }

    if (status == 401) {
      return handler.next(err);
    }

    if (status == 404 && _isGetRequest(request)) {
      return handler.next(err);
    }

    if (status == 429) {
      final backendMessage = err.response?.data?['message'];
      _showSnackBar(backendMessage ?? 'Muitas tentativas. Tente novamente.');
      return handler.next(err);
    }

    if (status == 403) {
      _showSnackBar('Você não tem permissão para esta ação.');
      return handler.next(err);
    }

    if (status != null && status >= 500) {
      _showSnackBar('Erro do servidor. Tente novamente em instantes.');
      return handler.next(err);
    }

    _showSnackBar('Erro inesperado. Tente novamente.');
    return handler.next(err);
  }
}
