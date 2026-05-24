import 'package:conectaparana/core/router/app_router.dart';
import 'package:conectaparana/core/shell/shell_tab.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

Widget _buildTestApp(GoRouter router) {
  return MaterialApp.router(routerConfig: router);
}

GoRouter _buildTestRouter() {
  return GoRouter(
    initialLocation: AppRoutes.home,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) {
          return Scaffold(
            body: shell,
            bottomNavigationBar: BottomNavigationBar(
              currentIndex: shell.currentIndex,
              onTap: (index) {
                if (index == shell.currentIndex) {
                  shell.goBranch(index, initialLocation: true);
                  return;
                }
                shell.goBranch(index);
              },
              items: ShellTab.values.map((tab) {
                return BottomNavigationBarItem(
                  icon: Icon(tab.icon),
                  label: tab.label,
                );
              }).toList(),
            ),
          );
        },
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.home,
              builder: (context, state) => const _TabPage(label: 'Início', key: ValueKey('home')),
              routes: [
                GoRoute(
                  path: 'detail',
                  builder: (context, state) => const _TabPage(label: 'Detalhe Home'),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.events,
              builder: (context, state) => const _TabPage(label: 'Eventos', key: ValueKey('events')),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.map,
              builder: (context, state) => const _TabPage(label: 'Mapa', key: ValueKey('map')),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.tickets,
              builder: (context, state) => const _TabPage(label: 'Tickets', key: ValueKey('tickets')),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.profile,
              builder: (context, state) => const _TabPage(label: 'Perfil', key: ValueKey('profile')),
            ),
          ]),
        ],
      ),
    ],
  );
}

void main() {
  group('MainShell — navegação entre abas', () {
    testWidgets('exibe aba Home ao inicializar', (tester) async {
      await tester.pumpWidget(_buildTestApp(_buildTestRouter()));
      await tester.pumpAndSettle();

      expect(find.text('Início'), findsWidgets);
    });

    testWidgets('navega para aba Eventos ao tocar', (tester) async {
      await tester.pumpWidget(_buildTestApp(_buildTestRouter()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Eventos').last);
      await tester.pumpAndSettle();

      expect(find.text('Eventos'), findsWidgets);
    });

    testWidgets('navega para todas as abas corretamente', (tester) async {
      await tester.pumpWidget(_buildTestApp(_buildTestRouter()));
      await tester.pumpAndSettle();

      final tabs = ['Eventos', 'Mapa', 'Tickets', 'Perfil'];
      for (final label in tabs) {
        await tester.tap(find.text(label).last);
        await tester.pumpAndSettle();
        expect(find.text(label), findsWidgets);
      }
    });
  });

  group('MainShell — preservação de state', () {
    testWidgets('volta para aba com state preservado', (tester) async {
      await tester.pumpWidget(_buildTestApp(_buildTestRouter()));
      await tester.pumpAndSettle();

      // Vai para Eventos
      await tester.tap(find.text('Eventos').last);
      await tester.pumpAndSettle();

      // Volta para Início
      await tester.tap(find.text('Início').last);
      await tester.pumpAndSettle();

      // Volta para Eventos — state deve estar preservado
      await tester.tap(find.text('Eventos').last);
      await tester.pumpAndSettle();

      expect(find.text('Eventos'), findsWidgets);
    });
  });

  group('MainShell — tap em aba já ativa', () {
    testWidgets('tap em aba ativa faz pop ao root', (tester) async {
      final router = _buildTestRouter();
      await tester.pumpWidget(_buildTestApp(router));
      await tester.pumpAndSettle();

      router.go('/home/detail');
      await tester.pumpAndSettle();

      expect(find.text('Detalhe Home'), findsOneWidget);

      await tester.tap(find.text('Início').last);
      await tester.pumpAndSettle();

      expect(find.text('Início'), findsWidgets);
      expect(find.text('Detalhe Home'), findsNothing);
    });

    testWidgets('tap em aba ativa no root não causa erro', (tester) async {
      await tester.pumpWidget(_buildTestApp(_buildTestRouter()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Início').last);
      await tester.pumpAndSettle();

      expect(find.text('Início'), findsWidgets);
    });
  });

  group('ShellTab', () {
    test('fromPath retorna a aba correta', () {
      expect(ShellTab.fromPath('/home'), equals(ShellTab.home));
      expect(ShellTab.fromPath('/home/comunicado/abc'), equals(ShellTab.home));
      expect(ShellTab.fromPath('/events/evt_123'), equals(ShellTab.events));
      expect(ShellTab.fromPath('/map/loc_456'), equals(ShellTab.map));
      expect(ShellTab.fromPath('/tickets/tkt_789'), equals(ShellTab.tickets));
      expect(ShellTab.fromPath('/profile'), equals(ShellTab.profile));
    });

    test('fromPath retorna null para path desconhecido', () {
      expect(ShellTab.fromPath('/login'), isNull);
      expect(ShellTab.fromPath('/unknown'), isNull);
    });

    test('rootPath de cada aba está correto', () {
      expect(ShellTab.home.rootPath, equals('/home'));
      expect(ShellTab.events.rootPath, equals('/events'));
      expect(ShellTab.map.rootPath, equals('/map'));
      expect(ShellTab.tickets.rootPath, equals('/tickets'));
      expect(ShellTab.profile.rootPath, equals('/profile'));
    });
  });
}

class _TabPage extends StatelessWidget {
  final String label;
  const _TabPage({required this.label, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text(label)));
  }
}