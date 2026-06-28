import 'dart:async';
import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_week_card.dart';
import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/domain/entities/feed_page.dart';
import 'package:conectaparana/features/home/domain/entities/home_highlights.dart';
import 'package:conectaparana/features/home/domain/repositories/feed_repository.dart';
import 'package:conectaparana/features/home/presentation/pages/home_page.dart';
import 'package:conectaparana/features/home/presentation/providers/feed_notifier.dart';
import 'package:conectaparana/features/home/presentation/widgets/events_carousel.dart';
import 'package:conectaparana/shared/widgets/navigation/app_header.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';

class MockFeedRepository extends Mock implements FeedRepository {}

FeedItem _item(String id, FeedItemType type) =>
    FeedItem(id: id, type: type, title: 'Item $id');

FeedPage _page(List<FeedItem> items, {String? cursor}) =>
    FeedPage(items: items, nextCursor: cursor, hasMore: cursor != null);

Widget _wrap(Widget child) {
  return MaterialApp(home: child);
}

Widget _wrapWithRoutes(FeedNotifier notifier) {
  final router = GoRouter(
    initialLocation: '/home',
    routes: [
      GoRoute(
        path: '/home',
        builder: (context, state) => HomePage(mockNotifier: notifier),
      ),
      GoRoute(
        path: '/services',
        builder: (context, state) => const Scaffold(body: Text('SERVICES_ALL')),
      ),
      GoRoute(
        path: '/events',
        builder: (context, state) => Scaffold(
          body: Text('EVENTS_${state.uri.queryParameters['filter']}'),
        ),
      ),
    ],
  );

  return MaterialApp.router(routerConfig: router);
}

Widget _wrapWithShellRoutes(FeedNotifier notifier) {
  final router = GoRouter(
    initialLocation: '/home',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => Scaffold(
          body: navigationShell,
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: navigationShell.currentIndex,
            onTap: navigationShell.goBranch,
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Início'),
              BottomNavigationBarItem(
                icon: Icon(Icons.event),
                label: 'Eventos',
              ),
            ],
          ),
        ),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => HomePage(mockNotifier: notifier),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/events',
                builder: (context, state) =>
                    const Scaffold(body: Text('EVENTS_TAB')),
              ),
            ],
          ),
        ],
      ),
    ],
  );

  return MaterialApp.router(routerConfig: router);
}

FeedNotifier _notifier(FeedRepository repo) =>
    FeedNotifier(repository: repo, cityId: 'city_01');

FeedPage _homePageWithHighlights() {
  return FeedPage(
    items: [_item('c1', FeedItemType.comunicado)],
    highlights: HomeHighlights(
      services: const [
        HomeService(
          id: 'cat_1',
          label: 'Saúde',
          icon: 'local_hospital_outlined',
          route: '/map',
        ),
      ],
      events: [
        EventListItem(
          id: 'evt_1',
          title: 'Feira',
          category: 'evento',
          date: DateTime(2026, 6, 25),
          dateLabel: '25 JUN',
          time: '19:00',
          location: 'Centro',
          gradientColors: ['0xFF006733', '0xFF004D26'],
          detailRoute: '/events/evt_1',
        ),
      ],
    ),
    hasMore: false,
  );
}

Finder _scrollableFeed() => find.byWidgetPredicate(
  (widget) =>
      widget is Scrollable && widget.physics is AlwaysScrollableScrollPhysics,
);

Future<void> _scrollToFinder(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(finder, 300, scrollable: _scrollableFeed());
}

void main() {
  late MockFeedRepository repo;

  setUp(() {
    repo = MockFeedRepository();
  });

  testWidgets('Deve renderizar skeleton durante loading', (tester) async {
    final completer = Completer<FeedPage>();

    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((_) => completer.future);

    final notifier = _notifier(repo);
    notifier.load();

    await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
    await tester.pump();

    expect(find.byType(ListView), findsOneWidget);

    completer.complete(_page([]));
    await tester.pumpAndSettle();
  });

  testWidgets('Deve renderizar lista de itens após sucesso', (tester) async {
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer(
      (_) async => _page([
        _item('e1', FeedItemType.event),
        _item('c1', FeedItemType.comunicado),
        _item('n1', FeedItemType.news),
      ]),
    );

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    await _scrollToFinder(tester, find.text('Item e1'));
    expect(find.text('Item e1'), findsOneWidget);

    await _scrollToFinder(tester, find.text('Item c1'));
    expect(find.text('Item c1'), findsOneWidget);

    await _scrollToFinder(tester, find.text('Item n1'));
    expect(find.text('Item n1'), findsOneWidget);
  });

  testWidgets('Deve mostrar EmptyState quando feed vem vazio', (tester) async {
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((_) async => _page([]));

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    await _scrollToFinder(tester, find.text('Nada por aqui ainda'));
    expect(find.text('Nada por aqui ainda'), findsOneWidget);
  });

  testWidgets(
    'Deve mostrar estado de erro com botão "Tentar novamente" em falha de rede',
    (tester) async {
      when(
        () => repo.getFeed(
          cityId: any(named: 'cityId'),
          lat: any(named: 'lat'),
          lng: any(named: 'lng'),
          cursor: any(named: 'cursor'),
          limit: any(named: 'limit'),
        ),
      ).thenThrow(const FeedNetworkException());

      final notifier = _notifier(repo);
      await notifier.load();

      await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
      await tester.pumpAndSettle();

      await _scrollToFinder(tester, find.text('Tentar novamente'));

      expect(find.byIcon(Icons.cloud_off_outlined), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);

      await tester.ensureVisible(find.text('Tentar novamente'));
      await tester.pumpAndSettle();

      clearInteractions(repo);
      await tester.tap(find.text('Tentar novamente'));
      await tester.pump();

      verify(
        () => repo.getFeed(
          cityId: any(named: 'cityId'),
          lat: any(named: 'lat'),
          lng: any(named: 'lng'),
          cursor: any(named: 'cursor'),
          limit: any(named: 'limit'),
        ),
      ).called(1);
    },
  );

  testWidgets('Pull-to-refresh recarrega o feed', (tester) async {
    var callCount = 0;
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((_) async {
      callCount++;
      return _page([_item('item_$callCount', FeedItemType.news)]);
    });

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    await _scrollToFinder(tester, find.text('Item item_1'));
    expect(find.text('Item item_1'), findsOneWidget);

    final scrollableState = tester.state<ScrollableState>(_scrollableFeed());
    scrollableState.position.jumpTo(0);
    await tester.pump();

    await tester.fling(find.byType(ListView), const Offset(0, 400), 1000);
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(callCount, greaterThanOrEqualTo(2));
  });

  testWidgets('Scroll até o fim dispara loadMore', (tester) async {
    var calls = 0;
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((inv) async {
      calls++;
      final cursor = inv.namedArguments[#cursor] as String?;
      if (cursor == null) {
        return _page(
          List.generate(10, (i) => _item('item_$i', FeedItemType.news)),
          cursor: 'page_2',
        );
      }
      return _page(
        List.generate(5, (i) => _item('more_$i', FeedItemType.news)),
      );
    });

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    await tester.drag(find.byType(ListView), const Offset(0, -6000));
    await tester.pumpAndSettle();

    expect(calls, 2);
    expect(notifier.value.items.length, 15);
  });

  testWidgets('AppHeader é renderizado com hasAlert=true', (tester) async {
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((_) async => _page([]));

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrap(HomePage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    expect(find.byType(AppHeader), findsOneWidget);
  });

  testWidgets('atalho Todos de Serviços abre listagem completa de serviços', (
    tester,
  ) async {
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((_) async => _homePageWithHighlights());

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrapWithRoutes(notifier));
    await tester.pumpAndSettle();

    await tester.tap(
      find.descendant(
        of: find.byKey(const Key('home_services_all_button')),
        matching: find.text('Todos'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('SERVICES_ALL'), findsOneWidget);
  });

  testWidgets('Ver tudo de Eventos próximos ativa a aba Eventos', (
    tester,
  ) async {
    when(
      () => repo.getFeed(
        cityId: any(named: 'cityId'),
        lat: any(named: 'lat'),
        lng: any(named: 'lng'),
        cursor: any(named: 'cursor'),
        limit: any(named: 'limit'),
      ),
    ).thenAnswer((_) async => _homePageWithHighlights());

    final notifier = _notifier(repo);
    await notifier.load();

    await tester.pumpWidget(_wrapWithShellRoutes(notifier));
    await tester.pumpAndSettle();

    await tester.tap(
      find.descendant(
        of: find.byKey(const Key('home_events_see_all_button')),
        matching: find.text('Ver tudo'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('EVENTS_TAB'), findsOneWidget);
    expect(
      tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar)).currentIndex,
      1,
    );
  });

  testWidgets('carrossel da Home limita eventos a tres itens', (tester) async {
    final events = List.generate(
      5,
      (index) => EventListItem(
        id: 'evt_$index',
        title: 'Evento ${index + 1}',
        category: 'evento',
        date: DateTime(2026, 6, 25),
        dateLabel: '25 JUN',
        time: '19:00',
        location: 'Centro',
        gradientColors: const ['0xFF006733', '0xFF004D26'],
        detailRoute: '/events/evt_$index',
      ),
    );

    await tester.pumpWidget(
      MaterialApp(home: Scaffold(body: EventsCarousel(events: events))),
    );

    expect(
      find.byType(EventWeekCard, skipOffstage: false),
      findsNWidgets(3),
    );
    expect(find.text('Evento 1'), findsOneWidget);
    expect(find.text('Evento 3'), findsOneWidget);
    expect(find.text('Evento 4'), findsNothing);
    expect(find.text('Evento 5'), findsNothing);
  });

}
