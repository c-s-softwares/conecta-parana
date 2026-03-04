import 'package:conecta_parana/core/config/environment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const stagingUrl = 'https://api-staging.conectaparana.com.br';
  const prodUrl = 'https://api.conectaparana.com.br';
  
  group('Environment', () {
    test('URL da api injetada corretamente.', () {
      Environment.initialize(Flavor.dev);

      expect(Environment.apiBaseUrl, isNotEmpty);
      expect(Environment.apiBaseUrl, anyOf(stagingUrl, prodUrl));
    });

    test('Reflete as propriedades de ambiente baseadas no Flavor', () {
      // Teste pra DEV
      Environment.initialize(Flavor.dev);
      expect(Environment.name, 'DEV');
      expect(Environment.isDev, isTrue);

      // Teste pra PROD
      Environment.initialize(Flavor.prod);
      expect(Environment.name, 'PROD');
      expect(Environment.isDev, isFalse);
    });
  });
}