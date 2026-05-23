import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/step_city_screen.dart';

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

  setUp(() {
    mockRepository = MockOnboardingRepository();
  });

  Future<void> pumpStepCityScreen(WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StepCityScreen(repository: mockRepository, onNext: () {}),
        ),
      ),
    );
  }

  group('StepCityScreen Widget Tests', () {
    testWidgets('Botão "Próximo" deve iniciar desabilitado', (
      WidgetTester tester,
    ) async {
      await pumpStepCityScreen(tester);

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);
    });

    testWidgets('Fluxo Feliz: Selecionar cidade habilita o botão', (
      WidgetTester tester,
    ) async {
      await pumpStepCityScreen(tester);

      await tester.enterText(find.byType(TextField), 'Maringá');
      await tester.pumpAndSettle();

      await tester.tap(
        find.descendant(
          of: find.byType(ListView),
          matching: find.text('Maringá'),
        ),
      );
      await tester.pumpAndSettle();

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNotNull);
    });

    testWidgets('Erro 429: Exibe Aguarde e bloqueia botão', (
      WidgetTester tester,
    ) async {
      mockRepository.shouldThrowRateLimit = true;
      await pumpStepCityScreen(tester);

      await tester.enterText(find.byType(TextField), 'Maringá');
      await tester.pumpAndSettle();

      await tester.tap(
        find.descendant(
          of: find.byType(ListView),
          matching: find.text('Maringá'),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Próximo'));
      await tester.pump();
      await tester.pump();

      expect(find.text('Aguarde...'), findsOneWidget);

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);

      await tester.pumpAndSettle(const Duration(seconds: 60));
    });
  });
}
