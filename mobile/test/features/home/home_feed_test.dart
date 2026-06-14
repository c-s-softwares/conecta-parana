import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/auth_user.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/domain/entities/feed_page.dart';
import 'package:conectaparana/features/home/domain/repositories/feed_repository.dart';
import 'package:conectaparana/features/home/presentation/pages/home_page.dart';
import 'package:conectaparana/features/home/presentation/providers/feed_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mocktail/mocktail.dart';

class _MockFeedRepository extends Mock implements FeedRepository {}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late _MockFeedRepository repo;

  setUp(() {
    Environment.initialize(Flavor.dev);
    repo = _MockFeedRepository();

    final fakeService = AuthService.instance;
    fakeService.currentUser.value = AuthUser(
      id: 'usr_test',
      role: 'CITIZEN',
      cityId: 'city_maringa',
      cityName: 'Maringá',
    );
  });

  tearDown(() => AuthService.reset());

  testWidgets(
    'Fluxo: abrir app logado → ver feed → pull-to-refresh atualiza lista',
    (tester) async {
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
        return FeedPage(
          hasMore: false,
          items: [
            FeedItem(
              id: 'evt_$callCount',
              type: FeedItemType.event,
              title: 'Evento da chamada $callCount',
            ),
            FeedItem(
              id: 'not_$callCount',
              type: FeedItemType.news,
              title: 'Notícia da chamada $callCount',
            ),
          ],
        );
      });

      final notifier = FeedNotifier(repository: repo, cityId: 'city_maringa');

      await tester.pumpWidget(
        MaterialApp(home: HomePage(mockNotifier: notifier)),
      );

      await notifier.load();
      await tester.pumpAndSettle();

      final feedList = find.byType(ListView);
      expect(feedList, findsOneWidget);

      final scrollableFeed = find.byWidgetPredicate(
        (widget) =>
            widget is Scrollable &&
            widget.physics is AlwaysScrollableScrollPhysics,
      );

      await tester.scrollUntilVisible(
        find.text('Evento da chamada 1'),
        300,
        scrollable: scrollableFeed,
      );
      expect(find.text('Evento da chamada 1'), findsOneWidget);

      await tester.scrollUntilVisible(
        find.text('Notícia da chamada 1'),
        300,
        scrollable: scrollableFeed,
      );
      expect(find.text('Notícia da chamada 1'), findsOneWidget);

      final scrollableState = tester.state<ScrollableState>(scrollableFeed);
      scrollableState.position.jumpTo(0);
      await tester.pump();

      await tester.fling(feedList, const Offset(0, 400), 800);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      expect(callCount, greaterThanOrEqualTo(2));

      await tester.scrollUntilVisible(
        find.text('Evento da chamada $callCount'),
        300,
        scrollable: scrollableFeed,
      );
      expect(find.text('Evento da chamada $callCount'), findsOneWidget);
    },
  );
}
