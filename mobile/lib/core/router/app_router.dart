import 'package:app_links/app_links.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/presentation/forgot_password/forgot_password_page.dart';
import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';
import 'package:conectaparana/core/auth/presentation/register_screen.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/core/router/deep_link_parser.dart';
import 'package:conectaparana/core/router/deep_link_route.dart';
import 'package:conectaparana/core/router/navigator_key.dart';
import 'package:conectaparana/core/shell/main_shell.dart';
import 'package:conectaparana/dev/fakes/fake_event_repository.dart';
import 'package:conectaparana/dev/fakes/fake_ticket_repository.dart';
import 'package:conectaparana/features/events/presentation/pages/events_page.dart';
import 'package:conectaparana/features/events/presentation/pages/event_detail_page.dart';
import 'package:conectaparana/features/home/presentation/pages/home_page.dart';
import 'package:conectaparana/features/home/presentation/pages/content_list_page.dart';
import 'package:conectaparana/features/home/data/repositories/content_list_repository.dart';
import 'package:conectaparana/features/home/presentation/pages/services_list_page.dart';
import 'package:conectaparana/features/map/presentation/pages/map_page.dart';
import 'package:conectaparana/features/notifications/presentation/pages/notifications_page.dart';
import 'package:conectaparana/features/onboarding/presentation/onboarding_screen.dart';
import 'package:conectaparana/features/profile/presentation/pages/profile_page.dart';
import 'package:conectaparana/features/search/presentation/pages/search_page.dart';
import 'package:conectaparana/features/tickets/presentation/pages/new_ticket_page.dart';
import 'package:conectaparana/features/tickets/presentation/pages/ticket_detail_page.dart';
import 'package:conectaparana/features/tickets/presentation/pages/tickets_page.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/not_found_screen.dart';
import 'package:conectaparana/shared/widgets/pages/splash_page.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/news/presentation/pages/news_detail_page.dart';
import 'package:conectaparana/features/communicates/presentation/pages/communicate_detail_page.dart';
import 'package:conectaparana/features/suggestions/presentation/pages/suggestions_page.dart';
import 'package:conectaparana/features/suggestions/presentation/pages/new_suggestion_page.dart';
import 'package:conectaparana/features/favorites/pages/favorites_page.dart';

abstract class AppRoutes {
  static const splash = '/';
  static const login = '/login';

  static const forgotPassword = '/forgot-password';
  static const register = '/register';
  static const onboarding = '/onboarding';

  static const home = '/home';
  static const events = '/events';
  static const services = '/services';
  static const search = '/search';
  static const communicates = '/communicates';
  static const newsList = '/news';
  static const map = '/map';
  static const tickets = '/tickets';
  static const newTicket = '/tickets/new';
  static const profile = '/profile';
  static const favorites = '/profile/favorites';
  static const notifications = '/notifications';

  static const event = '/events/:id';
  static const homeEvent = '/home/event/:id';
  static const comunicado = '/home/comunicado/:id';
  static const news = '/home/news/:id';
  static const local = '/map/:id';
  static const ticket = '/tickets/:id';
  static const notification = '/home/notification/:id';

  static const suggestions = '/profile/suggestions';
  static const newSuggestion = '/profile/suggestions/new';

  static const styleguide = '/styleguide';

  // DEV ONLY — rotas com dados mockados, sem precisar de backend
  static const devEventDetail = '/dev/event/:id';
  static const devTickets = '/dev/tickets';
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
          path: AppRoutes.forgotPassword,
          builder: (context, state) => const ForgotPasswordPage(),
        ),
        GoRoute(
          path: AppRoutes.register,
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: AppRoutes.onboarding,

          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: AppRoutes.styleguide,
          builder: (context, state) => const StyleguideScreen(),
        ),
        GoRoute(
          path: AppRoutes.services,
          builder: (context, state) => const ServicesListPage(),
        ),
        GoRoute(
          path: AppRoutes.search,
          builder: (context, state) => SearchPage(
            initialQuery: state.uri.queryParameters['q'] ?? '',
            initialCategory: state.uri.queryParameters['category'] == 'events'
                ? SearchInitialCategory.events
                : null,
          ),
        ),
        GoRoute(
          path: AppRoutes.communicates,
          builder: (context, state) =>
              const ContentListPage(kind: ContentListKind.communicates),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) => CommunicateDetailPage(
                communicateId: state.pathParameters['id']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: AppRoutes.newsList,
          builder: (context, state) =>
              const ContentListPage(kind: ContentListKind.news),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) =>
                  NewsDetailPage(id: state.pathParameters['id']!),
            ),
          ],
        ),
        // DEV ONLY — abre EventDetailPage com dados mockados, sem backend
        GoRoute(
          path: AppRoutes.notifications,
          builder: (context, state) => const NotificationsPage(),
        ),
        GoRoute(
          path: AppRoutes.devEventDetail,
          builder: (context, state) => EventDetailPage(
            eventId: state.pathParameters['id']!,
            repository: const FakeEventRepository(),
          ),
        ),

        // DEV ONLY — abre TicketsPage com dados mockados, sem backend
        GoRoute(
          path: AppRoutes.devTickets,
          builder: (context, state) =>
              TicketsPage(repository: FakeTicketRepository()),
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
                      builder: (context, state) {
                        final id = state.pathParameters['id'] ?? '';

                        return CommunicateDetailPage(communicateId: id);
                      },
                    ),
                    GoRoute(
                      path: 'news/:id',
                      builder: (context, state) {
                        final id = state.pathParameters['id']!;

                        return NewsDetailPage(id: id);
                      },
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
                  builder: (context, state) => EventsPage(
                    initialFilter: _eventFilterFromQuery(
                      state.uri.queryParameters['filter'],
                    ),
                  ),
                  routes: [
                    GoRoute(
                      path: ':id',
                      builder: (context, state) =>
                          EventDetailPage(eventId: state.pathParameters['id']!),
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
                      path: 'new',
                      builder: (context, state) => const NewTicketPage(),
                    ),
                    GoRoute(
                      path: ':id',
                      builder: (context, state) => TicketDetailPage(
                        ticketId: state.pathParameters['id']!,
                      ),
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
                  routes: [
                    GoRoute(
                      path: 'suggestions',
                      builder: (context, state) => const SuggestionsPage(),
                      routes: [
                        GoRoute(
                          parentNavigatorKey: navigatorKey,
                          path: 'new',
                          builder: (context, state) =>
                              const NewSuggestionPage(),
                        ),
                      ],
                    ),
                    GoRoute(
                      path: 'favorites',
                      builder: (context, state) => const FavoritesPage(),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  String? _redirect(BuildContext context, GoRouterState state) {
    final user = AuthService.instance.currentUser.value;
    final isLoggedIn = user != null;
    final cityId = user?.cityId.trim();
    final hasCity = cityId != null && cityId.isNotEmpty && cityId != 'null';
    final location = state.matchedLocation;

    const publicRoutes = {
      AppRoutes.splash,
      AppRoutes.login,
      AppRoutes.register,
      AppRoutes.forgotPassword,
      AppRoutes.styleguide,
    };

    final isPublic = publicRoutes.contains(location);

    if (isLoggedIn && isPublic) {
      final pending = consumePendingDeepLink();
      if (pending != null) return pending;

      if (location == AppRoutes.register) {
        return AppRoutes.onboarding;
      }

      return hasCity ? AppRoutes.home : AppRoutes.onboarding;
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

  static EventListFilter _eventFilterFromQuery(String? value) {
    return switch (value) {
      'upcoming' => EventListFilter.proximos,
      'week' => EventListFilter.estaSemana,
      'today' => EventListFilter.hoje,
      'month' => EventListFilter.esteMes,
      _ => EventListFilter.todos,
    };
  }
}
