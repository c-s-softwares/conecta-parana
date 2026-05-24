import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/shared/widgets/pages/splash_page.dart';

void main() {
  testWidgets('Deve navegar para /home quando autenticado e com cidade completa', (WidgetTester tester) async {
    String? rotaAlvo;

    await tester.pumpWidget(
      MaterialApp(
        home: SplashPage(
          mockAuthCheck: () async => {'isLogged': true, 'hasCity': true},
          onNavigate: (rota) => rotaAlvo = rota,
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(milliseconds: 900));
    expect(rotaAlvo, '/home');
  });

  testWidgets('Deve navegar para /onboarding quando autenticado porem sem cidade configurada', (WidgetTester tester) async {
    String? rotaAlvo;

    await tester.pumpWidget(
      MaterialApp(
        home: SplashPage(
          mockAuthCheck: () async => {'isLogged': true, 'hasCity': false},
          onNavigate: (rota) => rotaAlvo = rota,
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(milliseconds: 900));
    expect(rotaAlvo, '/onboarding');
  });

  testWidgets('Deve navegar para /login quando nao autenticado no sistema', (WidgetTester tester) async {
    String? rotaAlvo;

    await tester.pumpWidget(
      MaterialApp(
        home: SplashPage(
          mockAuthCheck: () async => {'isLogged': false, 'hasCity': false},
          onNavigate: (rota) => rotaAlvo = rota,
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(milliseconds: 900));
    expect(rotaAlvo, '/login');
  });
}