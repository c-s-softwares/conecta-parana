import 'package:conectaparana/app.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'interceptors/auth_interceptor.dart';
import 'interceptors/refresh_interceptor.dart';
import 'interceptors/error_interceptor.dart';

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  late final BaseOptions _options = _buildOptions();

  late final Dio dio = Dio(_options);

  late final Dio refreshDio = Dio(_options);

  void init() {
    dio.interceptors.addAll([
      AuthInterceptor(),
      RefreshInterceptor(dio, refreshDio),
      ErrorInterceptor(dio: dio, navigatorKey: navigatorKey),
    ]);
  }

  BaseOptions _buildOptions() {
    const baseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://api.dev.conectaparana.pr.gov.br',
    );

    if (kDebugMode) {
      debugPrint('API BASE URL → $baseUrl');
    }

    return BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
  }
}
