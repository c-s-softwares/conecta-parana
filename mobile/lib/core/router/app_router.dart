import 'package:app_links/app_links.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';
import 'package:conectaparana/core/auth/presentation/register_screen.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/core/router/deep_link_parser.dart';
import 'package:conectaparana/core/router/deep_link_route.dart';
import 'package:conectaparana/core/router/navigator_key.dart';
import 'package:conectaparana/core/shell/main_shell.dart';
import 'package:conectaparana/dev/fakes/fake_event_repository.dart';
import 'package:conectaparana/features/events/presentation/pages/events_page.dart';
import 'package:conectaparana/features/events/presentation/pages/event_detail_page.dart';
import 'package:conectaparana/features/home/presentation/pages/home_page.dart';
import 'package:conectaparana/features/map/presentation/pages/map_page.dart';
import 'package:conectaparana/features/profile/presentation/pages/profile_page.dart';
import 'package:conectaparana/features/tickets/presentation/pages/tickets_page.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/not_found_screen.dart';
import 'package:conectaparana/shared/widgets/pages/splash_page.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

abstract class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const onboarding = '/onboarding';

  static const home = '/home';
  static const events = '/events';
  static const map = '/map';
  static const tickets = '/tickets';
  static const profile = '/profile';

  static const event = '/events/:id';
  static const homeEvent = '/home/event/:id';
  static const comunicado = '/home/comunicado/:id';
  static const news = '/home/news/:id';
  static const local = '/map/:id';
  static const ticket = '/tickets/:id';
  static const notification = '/home/notification/:id';

  static const styleguide = '/styleguide';

  // DEV ONLY — rotas com dados mockados, sem precisar de backend
  static const devEventDetail = '/dev/event/:id';
}

class AppRouter {
  AppRouter._();

  static AppRouter? _instance;
  static AppRouter get instance {
    _instance ??= AppRouter._();
    return _instance!;
  }

  @visibleForTesting
  static void reset() => _instance = null;

  DeepLinkRoute? _pendingDeepLink;
  DeepLinkRoute? get pendingDeepLink => _pendingDeepLink;

  void setPendingDeepLink(DeepLinkRoute? route) {
    _pendingDeepLink = route;
    if (kDebugMode) {
      debugPrint('[Router] pendingDeepLink → ${route?.path ?? 'null'}');
    }
  }

  String? consumePendingDeepLink() {
    final path = _pendingDeepLink?.path;
    _pendingDeepLink = null;
    return path;
  }

  final _appLinks = AppLinks();
  late final GoRouter router = _buildRouter();

  Future<void> init() async {
    try {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        if (kDebugMode) debugPrint('[DeepLink] cold start link: $initialUri');
        _handleIncomingLink(initialUri);
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[DeepLink] erro ao ler initial link: $e');
    }

    _appLinks.uriLinkStream.listen((uri) {
      if (kDebugMode) debugPrint('[DeepLink] link recebido: $uri');
      _handleIncomingLink(uri);
    });
  }

  void _handleIncomingLink(Uri uri) {
    final deepLink = DeepLinkParser.parse(uri);

    if (deepLink == null) {
      router.go(AppRoutes.home);
      _showErrorToast('Conteúdo não encontrado.');
      return;
    }

    final isLoggedIn = AuthService.instance.currentUser.value != null;

    if (!isLoggedIn) {
      setPendingDeepLink(deepLink);
      router.go(AppRoutes.login);
    } else {
      router.go(deepLink.path);
    }
  }

  void _showErrorToast(String message) {
    final context = navigatorKey.currentContext;
    if (context == null) return;
    AppToast.show(context, message: message, variant: AppToastVariant.error);
  }

  GoRouter _buildRouter() {
    return GoRouter(
      navigatorKey: navigatorKey,
      initialLocation: AppRoutes.splash,
      debugLogDiagnostics: Environment.isDev,
      redirect: _redirect,
      errorBuilder: (context, state) => const NotFoundScreen(),
      routes: [
        GoRoute(
          path: AppRoutes.splash,
          builder: (context, state) => const SplashPage(),
        ),
        GoRoute(
          path: AppRoutes.login,
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: AppRoutes.register,
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: AppRoutes.onboarding,
          builder: (context, state) => const StyleguideScreen(),
        ),
        GoRoute(
          path: AppRoutes.styleguide,
          builder: (context, state) => const StyleguideScreen(),
        ),

        // DEV ONLY — abre EventDetailPage com dados mockados, sem backend
        GoRoute(
          path: AppRoutes.devEventDetail,
          builder: (context, state) => EventDetailPage(
            eventId: state.pathParameters['id']!,
            repository: const FakeEventRepository(),
          ),
        ),

        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return MainShell(navigationShell: navigationShell);
          },
          branches: [
            // Inicio
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.home,
                  builder: (context, state) => const HomePage(),
                  routes: [
                    GoRoute(
                      path: 'event/:id',
                      builder: (context, state) =>
                          EventDetailPage(eventId: state.pathParameters['id']!),
                    ),
                    GoRoute(
                      path: 'comunicado/:id',
                      builder: (context, state) =>
                          _detailPlaceholder('comunicado', state),
                    ),
                    GoRoute(
                      path: 'news/:id',
                      builder: (context, state) =>
                          _detailPlaceholder('news', state),
                    ),
                    GoRoute(
                      path: 'notification/:id',
                      builder: (context, state) =>
                          _detailPlaceholder('notification', state),
                    ),
                  ],
                ),
              ],
            ),

            // Eventos
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.events,
                  builder: (context, state) => const EventsPage(),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) =>
                          _detailPlaceholder('event', state),
                    ),
                  ],
                ),
              ],
            ),

            // Mapa
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.map,
                  builder: (context, state) => const MapPage(),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) =>
                          _detailPlaceholder('local', state),
                    ),
                  ],
                ),
              ],
            ),

            // Tickets
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.tickets,
                  builder: (context, state) => const TicketsPage(),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) =>
                          _detailPlaceholder('ticket', state),
                    ),
                  ],
                ),
              ],
            ),

            // Perfil
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.profile,
                  builder: (context, state) => const ProfilePage(),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  String? _redirect(BuildContext context, GoRouterState state) {
    final isLoggedIn = AuthService.instance.currentUser.value != null;
    final location = state.matchedLocation;

    const publicRoutes = {AppRoutes.splash, AppRoutes.login, AppRoutes.register};
    final isPublic = publicRoutes.contains(location);

    if (isLoggedIn && isPublic) {
      final pending = consumePendingDeepLink();
      return pending ?? AppRoutes.home;
    }

    if (!isLoggedIn && !isPublic) {
      return AppRoutes.login;
    }

    return null;
  }

  static Widget _detailPlaceholder(String type, GoRouterState state) {
    final id = state.pathParameters['id'] ?? '';
    return Scaffold(
      appBar: AppBar(title: Text('$type: $id')),
      body: Center(child: Text('Detalhe de $type — $id')),
    );
  }
}
