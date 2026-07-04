import 'dart:async';

import 'package:conectaparana/core/auth/auth_event.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/auth_user.dart';
import 'package:conectaparana/features/profile/presentation/pages/profile_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  group('ProfilePage', () {
    testWidgets('exibe aviso de perfil em desenvolvimento', (tester) async {
      final authService = _FakeAuthService();

      await tester.pumpWidget(_wrap(authService));
      await tester.pumpAndSettle();

      expect(
        find.byKey(const Key('profile_development_banner')),
        findsOneWidget,
      );
      expect(
        find.text('A função de perfil estará disponível em breve!'),
        findsOneWidget,
      );
      expect(find.byKey(const Key('profile_suggestions_tile')), findsOneWidget);
      expect(find.byKey(const Key('profile_tickets_tile')), findsOneWidget);
      expect(find.byKey(const Key('profile_favorites_tile')), findsOneWidget);

      final suggestionsY = tester
          .getTopLeft(find.byKey(const Key('profile_suggestions_tile')))
          .dy;
      final ticketsY = tester
          .getTopLeft(find.byKey(const Key('profile_tickets_tile')))
          .dy;
      final favoritesY = tester
          .getTopLeft(find.byKey(const Key('profile_favorites_tile')))
          .dy;
      final logoutY = tester
          .getTopLeft(find.byKey(const Key('profile_logout_button')))
          .dy;
      expect(suggestionsY, lessThan(ticketsY));
      expect(ticketsY, lessThan(favoritesY));
      expect(favoritesY, lessThan(logoutY));
    });

    testWidgets(
      'botao de logout chama AuthService.logout e navega para login',
      (tester) async {
        final authService = _FakeAuthService();

        await tester.pumpWidget(_wrap(authService));
        await tester.pumpAndSettle();

        await tester.tap(find.byKey(const Key('profile_logout_button')));
        await tester.pumpAndSettle();

        expect(authService.logoutCalled, isTrue);
        expect(find.text('Login'), findsOneWidget);
      },
    );
  });
}

Widget _wrap(AuthService authService) {
  final router = GoRouter(
    initialLocation: '/profile',
    routes: [
      GoRoute(
        path: '/profile',
        builder: (context, state) => ProfilePage(authService: authService),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const Scaffold(body: Text('Login')),
      ),
    ],
  );

  return MaterialApp.router(routerConfig: router);
}

class _FakeAuthService implements AuthService {
  @override
  final ValueNotifier<AuthUser?> currentUser = ValueNotifier(
    AuthUser(
      id: 'usr_1',
      role: 'CIDADAO',
      cityId: 'cit_1',
      cityName: 'Maringa',
    ),
  );

  final _events = StreamController<AuthEvent>.broadcast();
  bool logoutCalled = false;

  @override
  Stream<AuthEvent> get events => _events.stream;

  @override
  Future<void> init() async {}

  @override
  Future<void> login({
    required String accessToken,
    required String refreshToken,
  }) async {}

  @override
  Future<void> logout({bool expired = false}) async {
    logoutCalled = true;
    currentUser.value = null;
  }

  @override
  Future<void> logoutAll() async {
    await logout();
  }

  @override
  Future<void> refresh() async {}

  @override
  Future<void> register() async {}

  @override
  Future<String?> getAccessToken() async => null;

  @override
  Future<String?> getRefreshToken() async => null;

  @override
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {}
}
