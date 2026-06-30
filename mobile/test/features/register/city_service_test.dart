import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:dio/dio.dart';

const _validCityId = 'cit_01ARZ3NDEKTSV4RRFFQ69G5FAV';

Dio _dioReturning(dynamic data) {
  final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        handler.resolve(Response(requestOptions: options, data: data));
      },
    ),
  );
  return dio;
}

void main() {
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await CityService.clearCache();
  });

  group('CityService cache', () {
    test('clearCache limpa cache em memória e disco', () async {
      SharedPreferences.setMockInitialValues({
        'cities_cache_v1': '[{"id":"1","name":"Curitiba"}]',
        'cities_cache_ts_v1': DateTime.now().millisecondsSinceEpoch,
      });

      await CityService.clearCache();

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('cities_cache_v1'), isNull);
      expect(prefs.getInt('cities_cache_ts_v1'), isNull);
    });

    test('cache expirado é ignorado (TTL > 1h)', () async {
      final umaHoraAtras = DateTime.now()
          .subtract(const Duration(hours: 1, minutes: 1))
          .millisecondsSinceEpoch;

      SharedPreferences.setMockInitialValues({
        'cities_cache_v1': '[{"id":"99","name":"Cidade Antiga"}]',
        'cities_cache_ts_v1': umaHoraAtras,
      });

      final prefs = await SharedPreferences.getInstance();
      final ts = prefs.getInt('cities_cache_ts_v1')!;
      final idade = DateTime.now().millisecondsSinceEpoch - ts;

      expect(idade > const Duration(hours: 1).inMilliseconds, isTrue);
    });

    test('cache cit_ incompleto e descartado e substituido pela API', () async {
      SharedPreferences.setMockInitialValues({
        'cities_cache_v1': '[{"id":"cit_1","name":"Cidade Antiga"}]',
        'cities_cache_ts_v1': DateTime.now().millisecondsSinceEpoch,
      });

      final service = CityService(
        dio: _dioReturning({
          'items': [
            {'id': _validCityId, 'name': 'Curitiba'},
          ],
        }),
      );
      final cities = await service.getCities();

      expect(cities.single.id, _validCityId);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('cities_cache_v1'), contains(_validCityId));
      expect(prefs.getString('cities_cache_v1'), isNot(contains('cit_1"')));
    });

    test('resposta sem ULID valido nao oferece cidades demo', () async {
      final service = CityService(
        dio: _dioReturning({
          'items': [
            {'id': 'curitiba', 'name': 'Curitiba'},
          ],
        }),
      );

      expect(service.getCities, throwsA(isA<InvalidCitiesResponseException>()));
    });
  });
}
