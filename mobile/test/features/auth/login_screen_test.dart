import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';

void main() {
  Future<void> abrirTela(
    WidgetTester tester, {
    Future<void> Function(String email, String senha)? mockLogin,
    String? rotaAlvo,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(mockLogin: mockLogin),
        routes: {'/home': (_) => const Scaffold(body: Text('Home'))},
      ),
    );
  }
  
  testWidgets('Deve mostrar erro quando email for inválido', (tester) async {
    await abrirTela(tester);

    await tester.enterText(find.byType(TextFormField).first, 'emailinvalido');
    await tester.tap(find.text('Entrar'));
    await tester.pump();

    expect(find.text('Informe um email válido'), findsOneWidget);
  });

  testWidgets('Deve mostrar erro quando senha estiver vazia', (tester) async {
    await abrirTela(tester);

    await tester.enterText(find.byType(TextFormField).first, 'teste@email.com');
    await tester.tap(find.text('Entrar'));
    await tester.pump();

    expect(find.text('Informe a senha'), findsOneWidget);
  });

  testWidgets('Deve mostrar snackbar quando backend retornar 401', (
    tester,
  ) async {
    await abrirTela(
      tester,
      mockLogin: (email, senha) async {
        throw DioException(
          requestOptions: RequestOptions(path: '/auth/login'),
          response: Response(
            requestOptions: RequestOptions(path: '/auth/login'),
            statusCode: 401,
          ),
        );
      },
    );

    await tester.enterText(find.byType(TextFormField).first, 'teste@email.com');
    await tester.enterText(find.byType(TextFormField).last, 'senha123');
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();

    expect(find.text('Email ou senha inválidos.'), findsOneWidget);
  });

  testWidgets('Deve navegar para /home quando login for bem sucedido', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(mockLogin: (email, senha) async {}),
        routes: {'/home': (_) => const Scaffold(body: Text('Home'))},
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, 'teste@email.com');
    await tester.enterText(find.byType(TextFormField).last, 'senha123');
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
  });
}

class _RotaObserver extends NavigatorObserver {
  final void Function(String rota) onPush;
  _RotaObserver({required this.onPush});

  @override
  void didPush(Route route, Route? previousRoute) {
    if (route.settings.name != null) {
      onPush(route.settings.name!);
    }
  }
}
