import 'package:app_links/app_links.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/core/router/deep_link_parser.dart';
import 'package:conectaparana/core/router/deep_link_route.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/not_found_screen.dart';
import 'package:conectaparana/shared/widgets/pages/splash_page.dart';
import 'package:conectaparana/shared/widgets/placeholder_screen.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:conectaparana/core/router/navigator_key.dart';

abstract class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const onboarding = '/onboarding';
  static const home = '/home';

  static const event = '/event/:id';
  static const comunicado = '/comunicado/:id';
  static const news = '/news/:id';
  static const local = '/local/:id';
  static const ticket = '/ticket/:id';
  static const notification = '/notification/:id';
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
    } catch(e) {
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
      _showSnackbar('Conteúdo não encontrado.');
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

  void _showSnackbar(String message) {
    final context = router.routerDelegate.navigatorKey.currentContext;
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
          path: AppRoutes.onboarding,
          builder: (context, state) => const StyleguideScreen(),
        ),
        GoRoute(
          path: AppRoutes.home,
          builder: (context, state) => const StyleguideScreen(),
        ),
        GoRoute(
          path: AppRoutes.event,
          builder: (context, state) => PlaceholderScreen(
            key: ValueKey('event-${state.pathParameters['id']}'),
          ),
        ),
        GoRoute(
          path: AppRoutes.comunicado,
          builder: (context, state) => PlaceholderScreen(
            key: ValueKey('comunicado-${state.pathParameters['id']}'),
          ),
        ),
        GoRoute(
          path: AppRoutes.news,
          builder: (context, state) => PlaceholderScreen(
            key: ValueKey('news-${state.pathParameters['id']}'),
          ),
        ),
        GoRoute(
          path: AppRoutes.local,
          builder: (context, state) => PlaceholderScreen(
            key: ValueKey('local-${state.pathParameters['id']}'),
          ),
        ),
        GoRoute(
          path: AppRoutes.ticket,
          builder: (context, state) => PlaceholderScreen(
            key: ValueKey('ticket-${state.pathParameters['id']}'),
          ),
        ),
        GoRoute(
          path: AppRoutes.notification,
          builder: (context, state) => PlaceholderScreen(
            key: ValueKey('notification-${state.pathParameters['id']}'),
          ),
        ),
      ],
    );
  }

  String? _redirect(BuildContext context, GoRouterState state) {
    final isLoggedIn = AuthService.instance.currentUser.value != null;
    final location = state.matchedLocation;

    const publicRoutes = {AppRoutes.splash, AppRoutes.login};
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
}
