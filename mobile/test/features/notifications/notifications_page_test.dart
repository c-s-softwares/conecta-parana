import 'package:conectaparana/features/notifications/presentation/pages/notifications_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('renderiza empty state sem notificacoes mockadas', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/notifications',
      routes: [
        GoRoute(
          path: '/',
          builder: (_, __) => const Scaffold(body: Text('Home')),
        ),
        GoRoute(
          path: '/notifications',
          builder: (_, __) => const NotificationsPage(),
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    expect(find.text('Notificações'), findsOneWidget);
    expect(find.text('Tudo em dia por aqui!'), findsOneWidget);
    expect(find.byType(NotificationsEmptyState), findsOneWidget);

    final markAll = tester.widget<TextButton>(
      find.byKey(const Key('notifications_mark_all_button')),
    );
    expect(markAll.onPressed, isNull);
    expect(find.byType(ListTile), findsNothing);
  });
}
