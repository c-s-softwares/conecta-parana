import 'package:conectaparana/core/network/interceptors/error_interceptor.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthService extends Mock implements AuthService {}

class MockHandler extends Mock implements ErrorInterceptorHandler {}

class MockDio extends Mock implements Dio {}

class FakeDioException extends Fake implements DioException {}

void main() {
  late MockAuthService auth;
  late MockHandler handler;
  late MockDio dio;
  late String? shownMessage;
  late ErrorInterceptor interceptor;

  setUpAll(() {
    registerFallbackValue(FakeDioException());
  });

  late bool offline;

  setUp(() {
    auth = MockAuthService();
    handler = MockHandler();
    dio = MockDio();
    shownMessage = null;
    offline = false;

    interceptor = ErrorInterceptor(
      dio: dio,
      authService: auth,
      onShowMessage: (msg) => shownMessage = msg,
      isOffline: () => offline,
    );

    when(() => handler.next(any())).thenReturn(null);
    when(() => auth.logout()).thenAnswer((_) async {});
  });

  DioException buildError({
    required int statusCode,
    Map<String, dynamic>? data,
    DioExceptionType type = DioExceptionType.badResponse,
    bool authenticated = false,
    String method = 'POST',
  }) {
    final requestOptions = RequestOptions(
      path: '/test',
      method: method,
      extra: {'auth': authenticated},
    );

    return DioException(
      requestOptions: requestOptions,
      response: Response(
        requestOptions: requestOptions,
        statusCode: statusCode,
        data: data,
      ),
      type: type,
    );
  }

  test('timeout (online) mostra mensagem de timeout', () async {
    final error = buildError(
      statusCode: 0,
      type: DioExceptionType.connectionTimeout,
    );

    await interceptor.onError(error, handler);

    expect(shownMessage, 'O servidor demorou a responder, tente novamente.');
    verify(() => handler.next(error)).called(1);
  });

  test(
    'erro de conexão (online) mostra "sem conexão com o servidor"',
    () async {
      final error = buildError(
        statusCode: 0,
        type: DioExceptionType.connectionError,
      );

      await interceptor.onError(error, handler);

      expect(shownMessage, 'Sem conexão com o servidor.');
      verify(() => handler.next(error)).called(1);
    },
  );

  test('offline suprime o toast e falha em silêncio', () async {
    offline = true;
    final error = buildError(
      statusCode: 0,
      type: DioExceptionType.connectionError,
    );

    await interceptor.onError(error, handler);

    expect(shownMessage, isNull);
    verify(() => handler.next(error)).called(1);
  });

  test('401 não é tratado pelo ErrorInterceptor', () async {
    final error = buildError(statusCode: 401, authenticated: true);
    await interceptor.onError(error, handler);
    verifyNever(() => auth.logout());
    expect(shownMessage, isNull);
    verify(() => handler.next(error)).called(1);
  });

  test('validation_failed não mostra snackbar', () async {
    final error = buildError(
      statusCode: 400,
      data: {'code': 'validation_failed'},
    );

    await interceptor.onError(error, handler);

    expect(shownMessage, isNull);
  });

  test('429 mostra mensagem do backend', () async {
    final error = buildError(
      statusCode: 429,
      data: {'message': 'Muitas tentativas'},
    );

    await interceptor.onError(error, handler);

    expect(shownMessage, 'Muitas tentativas');
  });

  test('5xx mostra erro de servidor', () async {
    final error = buildError(statusCode: 500);

    await interceptor.onError(error, handler);

    expect(shownMessage, 'Erro do servidor. Tente novamente em instantes.');
  });

  test('404 GET não mostra snackbar', () async {
    final error = buildError(statusCode: 404, method: 'GET');

    await interceptor.onError(error, handler);

    expect(shownMessage, isNull);
  });
}
