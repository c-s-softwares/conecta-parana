import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:dio/dio.dart';

class AuthInterceptor extends Interceptor {
  final AuthService _authService = AuthService.instance;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final requiredAuth = options.extra['auth'] == true;

    if (!requiredAuth) return handler.next(options);

    final token = await _authService.getAccessToken();

    if (token != null) options.headers['Authorization'] = 'Bearer $token';

    handler.next(options);
  }
}
