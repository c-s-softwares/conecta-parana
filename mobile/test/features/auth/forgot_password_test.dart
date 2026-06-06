import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/core/auth/presentation/forgot_password/forgot_password_page.dart';
import 'package:conectaparana/core/auth/presentation/forgot_password/forgot_password_controller.dart';
import 'package:conectaparana/core/auth/presentation/forgot_password/data/forgot_password_repository.dart';

class _HappyRepository extends ForgotPasswordRepository {
  @override
  Future<void> forgotPassword({required String email}) async {}

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {}
}

class _InvalidCodeRepository extends ForgotPasswordRepository {
  @override
  Future<void> forgotPassword({required String email}) async {}

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    throw const ForgotPasswordException(
      ForgotPasswordError.invalidOrExpiredCode,
    );
  }
}

class _WeakPasswordRepository extends ForgotPasswordRepository {
  @override
  Future<void> forgotPassword({required String email}) async {}

  @override
  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    throw const ForgotPasswordException(ForgotPasswordError.weakPassword);
  }
}

void main() {
  Widget buildApp(ForgotPasswordController controller) {
    return MaterialApp(
      home: ForgotPasswordPage(controller: controller),
      routes: {'/login': (_) => const Scaffold(body: Text('Login'))},
    );
  }

  Future<void> irAtePasso3(
    WidgetTester tester,
    ForgotPasswordController controller,
  ) async {
    await tester.enterText(find.byType(TextFormField), 'teste@email.com');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Enviar código'));
    await tester.pumpAndSettle();

    final caixas = find.byType(TextField);
    for (int i = 0; i < 6; i++) {
      await tester.enterText(caixas.at(i), '1');
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('Verificar código'));
    await tester.pumpAndSettle();
  }

  testWidgets('avança do passo 1 ao 3', (tester) async {
    final controller = ForgotPasswordController(repository: _HappyRepository());

    await tester.pumpWidget(buildApp(controller));
    await tester.pumpAndSettle();

    expect(find.text('PASSO 1 DE 3'), findsOneWidget);

    await irAtePasso3(tester, controller);

    expect(find.text('PASSO 3 DE 3'), findsOneWidget);
    expect(controller.currentStep, 2);
  });

  testWidgets('código inválido volta para o passo 2 com erro', (tester) async {
    final controller = ForgotPasswordController(
      repository: _InvalidCodeRepository(),
    );

    await tester.pumpWidget(buildApp(controller));
    await tester.pumpAndSettle();

    await irAtePasso3(tester, controller);

    await tester.enterText(find.byType(TextField).at(0), 'Senha@123');
    await tester.enterText(find.byType(TextField).at(1), 'Senha@123');
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Redefinir senha'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Redefinir senha'));
    await tester.pumpAndSettle();

    expect(controller.currentStep, 1);
    expect(find.text('Código inválido. Solicite um novo.'), findsOneWidget);
  });

  testWidgets('senha fraca liga a flag de erro', (tester) async {
    final controller = ForgotPasswordController(
      repository: _WeakPasswordRepository(),
    );

    await tester.pumpWidget(buildApp(controller));
    await tester.pumpAndSettle();

    await irAtePasso3(tester, controller);
    await tester.enterText(find.byType(TextField).at(0), 'Senha@123');
    await tester.enterText(find.byType(TextField).at(1), 'Senha@123');
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Redefinir senha'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Redefinir senha'));
    await tester.pumpAndSettle();
    expect(controller.currentStep, 2);
    expect(controller.weakPasswordError, isTrue);
  });
}
