import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:conectaparana/features/city_switcher/presentation/controllers/active_city_controller.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';

class _MockDio extends Mock implements Dio {}

class _MockStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late _MockDio dio;
  late _MockStorage storage;

  const cityA = City(id: 'maringa', name: 'Maringa');
  const cityB = City(id: 'curitiba', name: 'Curitiba');
  const cityC = City(id: 'sarandi', name: 'Sarandi');

  setUpAll(() => registerFallbackValue(Options()));

  setUp(() {
    dio = _MockDio();
    storage = _MockStorage();
    when(
      () => storage.write(key: any(named: 'key'), value: any(named: 'value')),
    ).thenAnswer((_) async {});
  });

  ActiveCityController build() => ActiveCityController(
        dio: dio,
        storage: storage,
        debounceDuration: const Duration(milliseconds: 50),
        retryDuration: const Duration(milliseconds: 50),
      );

  Response<dynamic> ok() => Response(
        requestOptions: RequestOptions(path: '/users/me/city'),
        statusCode: 200,
      );

  test('dispara PUT após o debounce', () async {
    when(
      () => dio.put(any(), data: any(named: 'data'), options: any(named: 'options')),
    ).thenAnswer((_) async => ok());

    final c = build();
    await c.setActiveCity(cityA);

    verifyNever(
      () => dio.put(any(), data: any(named: 'data'), options: any(named: 'options')),
    );

    await Future<void>.delayed(const Duration(milliseconds: 90));

    final captured = verify(
      () => dio.put('/users/me/city',
          data: captureAny(named: 'data'), options: any(named: 'options')),
    ).captured;
    expect(captured, hasLength(1));
    expect(captured.single, {'cityId': 'maringa'});

    c.dispose();
  });

  test('troca de cidade reseta o timer (só a última persiste)', () async {
    when(
      () => dio.put(any(), data: any(named: 'data'), options: any(named: 'options')),
    ).thenAnswer((_) async => ok());

    final c = build();
    await c.setActiveCity(cityA);
    await Future<void>.delayed(const Duration(milliseconds: 20)); 
    await c.setActiveCity(cityB); 

    await Future<void>.delayed(const Duration(milliseconds: 90));

    final captured = verify(
      () => dio.put('/users/me/city',
          data: captureAny(named: 'data'), options: any(named: 'options')),
    ).captured;
    expect(captured, hasLength(1)); 
    expect(captured.single, {'cityId': 'curitiba'}); 

    c.dispose();
  });

  test('só persiste após permanecer na mesma cidade (A->B->C)', () async {
    when(
      () => dio.put(any(), data: any(named: 'data'), options: any(named: 'options')),
    ).thenAnswer((_) async => ok());

    final c = build();
    await c.setActiveCity(cityA);
    await Future<void>.delayed(const Duration(milliseconds: 15));
    await c.setActiveCity(cityB);
    await Future<void>.delayed(const Duration(milliseconds: 15));
    await c.setActiveCity(cityC);

    await Future<void>.delayed(const Duration(milliseconds: 90));

    final captured = verify(
      () => dio.put('/users/me/city',
          data: captureAny(named: 'data'), options: any(named: 'options')),
    ).captured;
    expect(captured, hasLength(1));
    expect(captured.single, {'cityId': 'sarandi'});

    c.dispose();
  });

  test('429 update_too_frequent agenda retry (tenta de novo)', () async {
    var calls = 0;
    when(
      () => dio.put(any(), data: any(named: 'data'), options: any(named: 'options')),
    ).thenAnswer((_) async {
      calls++;
      if (calls == 1) {
        throw DioException(
          requestOptions: RequestOptions(path: '/users/me/city'),
          response: Response(
            requestOptions: RequestOptions(path: '/users/me/city'),
            statusCode: 429,
            data: {'code': 'update_too_frequent'},
          ),
        );
      }
      return ok();
    });

    final c = build();
    await c.setActiveCity(cityA);

    await Future<void>.delayed(const Duration(milliseconds: 90)); 
    await Future<void>.delayed(const Duration(milliseconds: 90)); 

    expect(calls, 2);
    c.dispose();
  });
}