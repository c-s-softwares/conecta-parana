import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';

import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/features/register/data/services/register_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/verify_email_screen.dart';

class _MockRepository extends Mock implements RegisterRepository {}

class _FakeAuthService implements AuthService {
  bool loginCalled = false;
  String? lastAccess;
  String? lastRefresh;

  @override
  Future<void> login({
    required String accessToken,
    required String refreshToken,
  }) async {
    loginCalled = true;
    lastAccess = accessToken;
    lastRefresh = refreshToken;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late _MockRepository repo;
  late _FakeAuthService auth;

  setUp(() {
    repo = _MockRepository();
    auth = _FakeAuthService();
  });

  Widget screen() {
    return MaterialApp(
      home: VerifyEmailScreen(
        email: 'teste@email.com',
        password: 'Senha@123',
        repository: repo,
        authService: auth,
      ),
      onGenerateRoute: (settings) {
        return MaterialPageRoute(
          builder: (_) => const Scaffold(body: Text('PROXIMA_TELA')),
        );
      },
    );
  }

  Future<void> enterCode(WidgetTester tester, String code) async {
    for (var i = 0; i < 6; i++) {
      await tester.enterText(find.byKey(Key('code_digit_$i')), code[i]);
      await tester.pump();
    }
  }

  Future<void> drainCooldown(WidgetTester tester) async {
    await tester.pump(const Duration(seconds: 61));
  }

  testWidgets('renderiza header, email e 6 caixas de dígito', (tester) async {
    await tester.pumpWidget(screen());
    await tester.pump();

    expect(find.text('Digite o código'), findsOneWidget);
    expect(find.textContaining('teste@email.com'), findsOneWidget);
    for (var i = 0; i < 6; i++) {
      expect(find.byKey(Key('code_digit_$i')), findsOneWidget);
    }

    await drainCooldown(tester);
  });

  testWidgets('botão Verificar habilita só com 6 dígitos', (tester) async {
    await tester.pumpWidget(screen());
    await tester.pump();

    var button = tester.widget<ElevatedButton>(
      find.byKey(const Key('verify_code_button')),
    );
    expect(button.onPressed, isNull);

    await enterCode(tester, '025362');

    button = tester.widget<ElevatedButton>(
      find.byKey(const Key('verify_code_button')),
    );
    expect(button.onPressed, isNotNull);

    await drainCooldown(tester);
  });

  testWidgets('fluxo feliz: verifica e loga', (tester) async {
    when(() => repo.verifyEmail(
          email: any(named: 'email'),
          code: any(named: 'code'),
        )).thenAnswer((_) async {});
    when(() => repo.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenAnswer((_) async => (
          accessToken: 'fake_access',
          refreshToken: 'fake_refresh',
        ));

    await tester.pumpWidget(screen());
    await tester.pump();

    await enterCode(tester, '025362');
    await tester.tap(find.byKey(const Key('verify_code_button')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump();

    verify(() => repo.verifyEmail(email: 'teste@email.com', code: '025362'))
        .called(1);
    verify(() => repo.login(email: 'teste@email.com', password: 'Senha@123'))
        .called(1);
    expect(auth.loginCalled, isTrue);
    expect(auth.lastAccess, 'fake_access');

    await drainCooldown(tester);
  });

  testWidgets('código inválido: mostra erro e NÃO loga', (tester) async {
    when(() => repo.verifyEmail(
          email: any(named: 'email'),
          code: any(named: 'code'),
        )).thenThrow(
      DioException(
        requestOptions: RequestOptions(path: '/auth/verify-email'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/verify-email'),
          statusCode: 400,
          data: {'code': 'invalid_code'},
        ),
      ),
    );

    await tester.pumpWidget(screen());
    await tester.pump();

    await enterCode(tester, '000000');
    await tester.tap(find.byKey(const Key('verify_code_button')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.textContaining('inválido'), findsOneWidget);
    expect(auth.loginCalled, isFalse);

    await drainCooldown(tester);
  });

  testWidgets('reenviar começa em cooldown (60s)', (tester) async {
    await tester.pumpWidget(screen());
    await tester.pump();

    expect(find.textContaining('Aguarde'), findsOneWidget);
    expect(find.byKey(const Key('resend_code_button')), findsNothing);

    await drainCooldown(tester);
  });
}