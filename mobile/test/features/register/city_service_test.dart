import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  });
}
