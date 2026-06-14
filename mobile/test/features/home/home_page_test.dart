import 'dart:async';

import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/domain/entities/feed_page.dart';
import 'package:conectaparana/features/home/domain/repositories/feed_repository.dart';
import 'package:conectaparana/features/home/presentation/pages/home_page.dart';
import 'package:conectaparana/features/home/presentation/providers/feed_notifier.dart';
import 'package:conectaparana/shared/widgets/navigation/app_header.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockFeedRepository extends Mock implements FeedRepository {}

FeedItem _item(String id, FeedItemType type) =>
    FeedItem(id: id, type: type, title: 'Item $id');

FeedPage _page(List<FeedItem> items, {String? cursor}) =>
    FeedPage(items: items, nextCursor: cursor, hasMore: cursor != null);

Widget _wrap(Widget child) {
  return MaterialApp(home: child);
}

FeedNotifier _notifier(FeedRepository repo) =>
    FeedNotifier(repository: repo, cityId: 'city_01');

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
    'Deve mostrar estado de erro com botão "Abrir Styleguide" em falha de rede',
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

      await _scrollToFinder(
        tester,
        find.text('Não foi possível carregar o feed'),
      );
      expect(find.text('Não foi possível carregar o feed'), findsOneWidget);
      expect(find.text('Abrir Styleguide'), findsOneWidget);
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
}
