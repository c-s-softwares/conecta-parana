import 'dart:async';
import 'package:dio/dio.dart';
import 'package:conectaparana/core/auth/auth_service.dart';

class RefreshInterceptor extends Interceptor {
  final Dio dio;
  final Dio refreshDio;
  final AuthService _authService;
  final void Function(String)? onShowMessage;

  bool _isRefreshing = false;
  final List<Completer<void>> _refreshQueue = [];

  RefreshInterceptor(
    this.dio,
    this.refreshDio, {
    AuthService? authService,
    this.onShowMessage,
  }) : _authService = authService ?? AuthService.instance;

  bool _isRefreshRequest(RequestOptions options) {
    return options.path.contains('/auth/refresh');
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final statusCode = err.response?.statusCode;
    final requestOptions = err.requestOptions;
    final requiresAuth = requestOptions.extra['auth'] == true;

    if (statusCode != 401 ||
        !requiresAuth ||
        _isRefreshRequest(requestOptions)) {
      return handler.next(err);
    }

    try {
      await _handle401();

      final newToken = await _authService.getAccessToken();
      requestOptions.headers['Authorization'] = 'Bearer $newToken';

      final response = await dio.fetch(requestOptions);
      return handler.resolve(response);
    } catch (e) {
      await _authService.logout(expired: true);
      return handler.next(err);
    }
  }

  Future<void> _handle401() async {
    if (_isRefreshing) {
      final completer = Completer<void>();
      _refreshQueue.add(completer);
      return completer.future;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _authService.getRefreshToken();
      if (refreshToken == null) throw Exception('No refresh token');

      final response = await refreshDio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      final newAccessToken = response.data['accessToken'];
      final newRefreshToken = response.data['refreshToken'];

      await _authService.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );

      for (final completer in _refreshQueue) {
        completer.complete();
      }

      _refreshQueue.clear();
    } catch (e) {
      for (final completer in _refreshQueue) {
        completer.completeError(e);
      }

      _refreshQueue.clear();
      rethrow;
    } finally {
      _isRefreshing = false;
    }
  }
}
