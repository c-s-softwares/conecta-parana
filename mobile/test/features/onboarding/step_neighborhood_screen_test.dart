import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/step_neighborhood_screen.dart';

class MockOnboardingRepository extends OnboardingRepository {
  bool isNeighborhoodUpdated = false;

  @override
  Future<void> updateNeighborhood(String neighborhood) async {
    isNeighborhoodUpdated = true;
    return Future.value();
  }
}

void main() {
  late MockOnboardingRepository mockRepository;
  bool nextStepCalled = false;

  setUp(() {
    mockRepository = MockOnboardingRepository();
    nextStepCalled = false;
  });

  Future<void> pumpNeighborhoodScreen(WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StepNeighborhoodScreen(
            repository: mockRepository,
            cityName: 'Maringá',
            onNext: () {
              nextStepCalled = true;
            },
          ),
        ),
      ),
    );
  }

  group('StepNeighborhoodScreen Widget Tests', () {
    testWidgets('Deve permitir pular o passo de bairro sem chamar a API', (
      WidgetTester tester,
    ) async {
      await pumpNeighborhoodScreen(tester);

      await tester.tap(find.text('Pular'));
      await tester.pump();

      expect(nextStepCalled, isTrue);
      expect(mockRepository.isNeighborhoodUpdated, isFalse);
    });
  });
}
