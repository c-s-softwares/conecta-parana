import 'package:conectaparana/core/router/app_router.dart';
import 'package:conectaparana/core/router/deep_link_route.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  setUp(() {
    AppRouter.reset();
  });

  tearDown(() {
    AppRouter.reset();
  });

  group('AppRouter — pendingDeepLink', () {
    test('começa sem deep link pendente', () {
      expect(AppRouter.instance.pendingDeepLink, isNull);
    });

    test('setPendingDeepLink armazena o deep link', () {
      const route = DeepLinkRoute(type: DeepLinkType.event, id: 'evt_123');
      AppRouter.instance.setPendingDeepLink(route);

      expect(AppRouter.instance.pendingDeepLink, equals(route));
    });

    test('consumePendingDeepLink retorna o path e limpa o estado', () {
      const route = DeepLinkRoute(type: DeepLinkType.event, id: 'evt_123');
      AppRouter.instance.setPendingDeepLink(route);

      final consumed = AppRouter.instance.consumePendingDeepLink();

      expect(consumed, equals('/event/evt_123'));
      expect(AppRouter.instance.pendingDeepLink, isNull);
    });

    test('consumePendingDeepLink retorna null quando não há deep link', () {
      final result = AppRouter.instance.consumePendingDeepLink();
      expect(result, isNull);
    });

    test('setPendingDeepLink(null) limpa o estado', () {
      const route = DeepLinkRoute(type: DeepLinkType.ticket, id: 'tkt_abc');
      AppRouter.instance.setPendingDeepLink(route);
      AppRouter.instance.setPendingDeepLink(null);

      expect(AppRouter.instance.pendingDeepLink, isNull);
    });

    test('segundo consumePendingDeepLink retorna null (idempotente)', () {
      const route = DeepLinkRoute(type: DeepLinkType.news, id: 'news_001');
      AppRouter.instance.setPendingDeepLink(route);

      AppRouter.instance.consumePendingDeepLink();
      final second = AppRouter.instance.consumePendingDeepLink();

      expect(second, isNull);
    });
  });

  group('AppRoutes — constantes de path', () {
    test('todas as rotas de detalhe usam parâmetro :id', () {
      final detailRoutes = [
        AppRoutes.event,
        AppRoutes.comunicado,
        AppRoutes.news,
        AppRoutes.local,
        AppRoutes.ticket,
        AppRoutes.notification,
      ];

      for (final route in detailRoutes) {
        expect(route, contains(':id'),
            reason: '$route deve conter :id');
      }
    });

    test('rotas públicas não contêm :id', () {
      final publicRoutes = [
        AppRoutes.splash,
        AppRoutes.login,
        AppRoutes.onboarding,
        AppRoutes.home,
      ];

      for (final route in publicRoutes) {
        expect(route, isNot(contains(':id')),
            reason: '$route não deve conter :id');
      }
    });
  });
}
