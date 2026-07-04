import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';
import 'package:conectaparana/core/router/app_router.dart';

void main() {
  Future<void> abrirTela(
    WidgetTester tester, {
    Future<void> Function(String email, String senha)? mockLogin,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(mockLogin: mockLogin),
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

    expect(find.text('E-mail ou senha inválidos.'), findsOneWidget);
    expect(find.byIcon(Icons.error_outline), findsOneWidget);
    expect(
      tester.widget<SnackBar>(find.byType(SnackBar)).backgroundColor,
      const Color(0xFFE53935),
    );
  });

  testWidgets('Deve navegar para /home quando login for bem sucedido', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: AppRoutes.login,
      routes: [
        GoRoute(
          path: AppRoutes.login,
          builder: (context, state) =>
              LoginScreen(mockLogin: (email, senha) async {}),
        ),
        GoRoute(
          path: AppRoutes.home,
          builder: (context, state) =>
              const Scaffold(body: Text('Home')),
        ),
      ],
    );

    await tester.pumpWidget(
      MaterialApp.router(routerConfig: router),
    );

    await tester.enterText(find.byType(TextFormField).first, 'teste@email.com');
    await tester.enterText(find.byType(TextFormField).last, 'senha123');
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
  });
}
