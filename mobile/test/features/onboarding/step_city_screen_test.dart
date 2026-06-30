import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/step_city_screen.dart';

class FakeCityService extends CityService {
  @override
  Future<List<City>> getCities() async {
    return [
      const City(id: 'curitiba', name: 'Curitiba', state: 'PR'),
      const City(id: 'maringa', name: 'Maringá', state: 'PR'),
    ];
  }
}

class ErrorCityService extends CityService {
  @override
  Future<List<City>> getCities() async {
    throw Exception('falha de rede');
  }
}

class MockOnboardingRepository extends OnboardingRepository {
  bool shouldThrowRateLimit = false;

  @override
  Future<void> updateCity(String cityId) async {
    if (shouldThrowRateLimit) {
      throw DioException(
        requestOptions: RequestOptions(path: '/users/me/city'),
        response: Response(
          requestOptions: RequestOptions(path: '/users/me/city'),
          statusCode: 429,
        ),
      );
    }
    return Future.value();
  }
}

void main() {
  late MockOnboardingRepository mockRepository;
  late FakeCityService fakeCityService;

  setUp(() {
    mockRepository = MockOnboardingRepository();
    fakeCityService = FakeCityService();
  });

  Future<void> pumpStepCityScreen(
    WidgetTester tester, {
    CityService? cityService,
    void Function(City)? onNext,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StepCityScreen(
            repository: mockRepository,
            cityService: cityService ?? fakeCityService,
            onNext: onNext ?? (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  group('StepCityScreen Widget Tests', () {
    testWidgets('mostra loading e depois a lista de cidades', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StepCityScreen(
              repository: mockRepository,
              cityService: fakeCityService,
              onNext: (_) {},
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();

      expect(find.text('Curitiba'), findsOneWidget);
      expect(find.text('Maringá'), findsOneWidget);
    });

    testWidgets('Botão "Próximo" deve iniciar desabilitado', (tester) async {
      await pumpStepCityScreen(tester);

      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('city_next_button')),
      );
      expect(button.onPressed, isNull);
    });

    testWidgets('Fluxo feliz: selecionar cidade habilita o botão', (
      tester,
    ) async {
      await pumpStepCityScreen(tester);

      await tester.tap(find.text('Maringá'));
      await tester.pumpAndSettle();

      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('city_next_button')),
      );
      expect(button.onPressed, isNotNull);
    });

    testWidgets('Fluxo feliz: tocar em Próximo chama onNext com a cidade', (
      tester,
    ) async {
      City? cidadeRecebida;
      await pumpStepCityScreen(tester, onNext: (city) => cidadeRecebida = city);

      await tester.tap(find.text('Maringá'));
      await tester.pump();
      await tester.tap(find.byKey(const Key('city_next_button')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(cidadeRecebida, isNotNull);
      expect(cidadeRecebida!.name, 'Maringá');
    });

    testWidgets('Erro 429: exibe Aguarde e bloqueia botão', (tester) async {
      mockRepository.shouldThrowRateLimit = true;
      await pumpStepCityScreen(tester);

      await tester.tap(find.text('Maringá'));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('city_next_button')));
      await tester.pump();
      await tester.pump();

      expect(find.text('Aguarde...'), findsOneWidget);
      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('city_next_button')),
      );
      expect(button.onPressed, isNull);

      await tester.pumpAndSettle(const Duration(seconds: 60));
    });

    testWidgets('Erro ao carregar: mostra botão Tentar novamente', (
      tester,
    ) async {
      await pumpStepCityScreen(tester, cityService: ErrorCityService());

      expect(find.text('Erro ao carregar cidades.'), findsOneWidget);
      expect(find.byKey(const Key('retry_cities_button')), findsOneWidget);
    });
  });
}