import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:conectaparana/core/network/interceptors/refresh_interceptor.dart';
import 'package:conectaparana/core/auth/auth_service.dart';

class MockDio extends Mock implements Dio {}

class MockAuthService extends Mock implements AuthService {}

class MockHandler extends Mock implements ErrorInterceptorHandler {}

class FakeRequestOptions extends Fake implements RequestOptions {}

class FakeResponse extends Fake implements Response<dynamic> {}

class FakeDioException extends Fake implements DioException {}

void main() {
  setUpAll(() {
    registerFallbackValue(FakeRequestOptions());
    registerFallbackValue(FakeResponse());
    registerFallbackValue(FakeDioException());
  });

  late MockDio dio;
  late MockDio refreshDio;
  late MockAuthService authService;
  late MockHandler handler;
  late RefreshInterceptor interceptor;

  setUp(() {
    dio = MockDio();
    refreshDio = MockDio();
    authService = MockAuthService();
    handler = MockHandler();

    AuthService.overrideInstance(authService);

    interceptor = RefreshInterceptor(dio, refreshDio);

    when(() => handler.resolve(any())).thenReturn(null);
    when(() => handler.next(any())).thenReturn(null);
  });

  tearDown(() {
    AuthService.reset();
  });

  test('401 → faz refresh → refaz request', () async {
    final requestOptions = RequestOptions(
      path: '/feed',
      method: 'GET',
      extra: {'auth': true},
    );

    final dioError = DioException(
      requestOptions: requestOptions,
      response: Response(requestOptions: requestOptions, statusCode: 401),
      type: DioExceptionType.badResponse,
    );

    when(
      () => authService.getRefreshToken(),
    ).thenAnswer((_) async => 'refresh_token');

    when(
      () => refreshDio.post('/auth/refresh', data: any(named: 'data')),
    ).thenAnswer(
      (_) async => Response(
        requestOptions: RequestOptions(path: '/auth/refresh'),
        data: {'accessToken': 'new_access', 'refreshToken': 'new_refresh'},
        statusCode: 200,
      ),
    );

    when(
      () => authService.saveTokens(
        accessToken: any(named: 'accessToken'),
        refreshToken: any(named: 'refreshToken'),
      ),
    ).thenAnswer((_) async {});

    when(
      () => authService.getAccessToken(),
    ).thenAnswer((_) async => 'new_access');

    when(() => dio.fetch(any())).thenAnswer(
      (_) async => Response(
        requestOptions: requestOptions,
        statusCode: 200,
        data: {'ok': true},
      ),
    );

    interceptor.onError(dioError, handler);
    await Future.delayed(Duration.zero);

    verify(
      () => refreshDio.post('/auth/refresh', data: any(named: 'data')),
    ).called(1);

    verify(() => dio.fetch(any())).called(1);
  });

  test('401 + refresh falha → logout', () async {
    final requestOptions = RequestOptions(
      path: '/feed',
      method: 'GET',
      extra: {'auth': true},
    );

    final dioError = DioException(
      requestOptions: requestOptions,
      response: Response(requestOptions: requestOptions, statusCode: 401),
      type: DioExceptionType.badResponse,
    );

    when(
      () => authService.getRefreshToken(),
    ).thenAnswer((_) async => 'refresh_token');
    when(
      () => refreshDio.post('/auth/refresh', data: any(named: 'data')),
    ).thenThrow(Exception('refresh failed'));
    when(
      () => authService.logout(expired: any(named: 'expired')),
    ).thenAnswer((_) async {});

    interceptor.onError(dioError, handler);
    await Future.delayed(Duration.zero);

    verify(() => authService.logout(expired: true)).called(1);
    verify(() => handler.next(dioError)).called(1);
  });

  test('Erro != 401 não tenta refresh', () async {
    final requestOptions = RequestOptions(
      path: '/feed',
      method: 'GET',
      extra: {'auth': true},
    );

    final dioError = DioException(
      requestOptions: requestOptions,
      response: Response(requestOptions: requestOptions, statusCode: 500),
      type: DioExceptionType.badResponse,
    );

    interceptor.onError(dioError, handler);
    await Future.delayed(Duration.zero);

    verifyNever(() => refreshDio.post(any(), data: any(named: 'data')));
    verify(() => handler.next(dioError)).called(1);
  });

  test('Request sem auth não tenta refresh', () async {
    final requestOptions = RequestOptions(path: '/feed', method: 'GET');

    final dioError = DioException(
      requestOptions: requestOptions,
      response: Response(requestOptions: requestOptions, statusCode: 401),
      type: DioExceptionType.badResponse,
    );

    interceptor.onError(dioError, handler);
    await Future.delayed(Duration.zero);

    verifyNever(() => refreshDio.post(any(), data: any(named: 'data')));
  });

  test(
    'requisições paralelas durante refresh — só um refresh ocorre',
    () async {
      final options1 = RequestOptions(path: '/feed', extra: {'auth': true});
      final options2 = RequestOptions(path: '/profile', extra: {'auth': true});
      final options3 = RequestOptions(
        path: '/notifications',
        extra: {'auth': true},
      );

      DioException make401(RequestOptions opts) => DioException(
        requestOptions: opts,
        response: Response(requestOptions: opts, statusCode: 401),
        type: DioExceptionType.badResponse,
      );

      when(
        () => authService.getRefreshToken(),
      ).thenAnswer((_) async => 'refresh_token');
      when(
        () => refreshDio.post('/auth/refresh', data: any(named: 'data')),
      ).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/auth/refresh'),
          data: {'accessToken': 'new_access', 'refreshToken': 'new_refresh'},
          statusCode: 200,
        ),
      );
      when(
        () => authService.saveTokens(
          accessToken: any(named: 'accessToken'),
          refreshToken: any(named: 'refreshToken'),
        ),
      ).thenAnswer((_) async {});
      when(
        () => authService.getAccessToken(),
      ).thenAnswer((_) async => 'new_access');
      when(() => dio.fetch(any())).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/'),
          statusCode: 200,
        ),
      );

      interceptor.onError(make401(options1), handler);
      interceptor.onError(make401(options2), handler);
      interceptor.onError(make401(options3), handler);

      await Future.delayed(const Duration(milliseconds: 100));

      verify(
        () => refreshDio.post('/auth/refresh', data: any(named: 'data')),
      ).called(1);

      verify(() => dio.fetch(any())).called(3);
    },
  );
}
