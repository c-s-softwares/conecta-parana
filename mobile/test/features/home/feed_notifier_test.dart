import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/domain/entities/feed_page.dart';
import 'package:conectaparana/features/home/domain/repositories/feed_repository.dart';
import 'package:conectaparana/features/home/presentation/providers/feed_notifier.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockFeedRepository extends Mock implements FeedRepository {}

FeedItem _item(String id, {FeedItemType type = FeedItemType.news}) =>
    FeedItem(id: id, type: type, title: 'Item $id');

FeedPage _page(List<FeedItem> items, {String? cursor}) =>
    FeedPage(items: items, nextCursor: cursor, hasMore: cursor != null);

FeedNotifier _makeNotifier(FeedRepository repo) =>
    FeedNotifier(repository: repo, cityId: 'city_01');

When<Future<FeedPage>> _whenGetFeed(MockFeedRepository repo) => when(
  () => repo.getFeed(
    cityId: any(named: 'cityId'),
    lat: any(named: 'lat'),
    lng: any(named: 'lng'),
    cursor: any(named: 'cursor'),
    limit: any(named: 'limit'),
  ),
);

void main() {
  late MockFeedRepository repo;

  setUp(() => repo = MockFeedRepository());

  group('load()', () {
    test('estado inicial é FeedStatus.initial', () {
      expect(_makeNotifier(repo).value.status, FeedStatus.initial);
    });

    test('emite loading → success com itens', () async {
      _whenGetFeed(
        repo,
      ).thenAnswer((_) async => _page([_item('1'), _item('2')]));

      final notifier = _makeNotifier(repo);
      await notifier.load();

      expect(notifier.value.status, FeedStatus.success);
      expect(notifier.value.items.length, 2);
    });

    test('emite empty quando a página vem vazia', () async {
      _whenGetFeed(repo).thenAnswer((_) async => _page([]));

      final notifier = _makeNotifier(repo);
      await notifier.load();

      expect(notifier.value.status, FeedStatus.empty);
    });

    test('emite errorFirst em falha de rede no primeiro load', () async {
      _whenGetFeed(repo).thenThrow(const FeedNetworkException());

      final notifier = _makeNotifier(repo);
      await notifier.load();

      expect(notifier.value.status, FeedStatus.errorFirst);
    });

    test(
      'sinaliza redirectToOnboarding quando city_required é lançado',
      () async {
        _whenGetFeed(repo).thenThrow(const FeedCityRequiredException());

        final notifier = _makeNotifier(repo);
        await notifier.load();

        expect(notifier.value.redirectToOnboarding, isTrue);
      },
    );
  });

  group('refresh()', () {
    test('limpa cursor e recarrega do início (cursor null)', () async {
      final cursors = <String?>[];

      _whenGetFeed(repo).thenAnswer((inv) async {
        cursors.add(inv.namedArguments[#cursor] as String?);
        return _page([_item('1')], cursor: 'p2');
      });

      final notifier = _makeNotifier(repo);
      await notifier.load();
      await notifier.refresh();

      expect(cursors.last, isNull);
      expect(notifier.value.status, FeedStatus.success);
    });

    test('ignora segundo refresh enquanto um já está em andamento', () async {
      var callCount = 0;

      _whenGetFeed(repo).thenAnswer((_) async {
        callCount++;
        await Future.delayed(const Duration(milliseconds: 50));
        return _page([_item('1')]);
      });

      final notifier = _makeNotifier(repo);
      await notifier.load();
      callCount = 0;

      final f1 = notifier.refresh();
      final f2 = notifier.refresh();
      await Future.wait([f1, f2]);

      expect(callCount, 1);
    });
  });

  group('loadMore()', () {
    test('acumula itens e passa cursor correto', () async {
      _whenGetFeed(repo).thenAnswer((inv) async {
        final cursor = inv.namedArguments[#cursor] as String?;
        if (cursor == null) return _page([_item('a'), _item('b')], cursor: 'p2');
        return _page([_item('c'), _item('d')]);
      });

      final notifier = _makeNotifier(repo);
      await notifier.load();
      await notifier.loadMore();

      expect(notifier.value.items.length, 4);
      expect(notifier.value.hasMore, isFalse);
    });

    test('não chama API quando hasMore é false', () async {
      _whenGetFeed(repo).thenAnswer(
        (_) async => _page([_item('1')]),
      );

      final notifier = _makeNotifier(repo);
      await notifier.load();
      await notifier.loadMore();

      verify(
        () => repo.getFeed(
          cityId: any(named: 'cityId'),
          lat: any(named: 'lat'),
          lng: any(named: 'lng'),
          cursor: any(named: 'cursor'),
          limit: any(named: 'limit'),
        ),
      ).called(1);
    });

    test('emite errorMore em falha de rede durante scroll infinito', () async {
      var calls = 0;

      _whenGetFeed(repo).thenAnswer((_) async {
        calls++;
        if (calls == 1) return _page([_item('1')], cursor: 'p2');
        throw const FeedNetworkException();
      });

      final notifier = _makeNotifier(repo);
      await notifier.load();
      await notifier.loadMore();

      expect(notifier.value.status, FeedStatus.errorMore);
      expect(notifier.value.items.length, 1);
    });

    test('reset de cursor e reload quando invalid_cursor é lançado', () async {
      var calls = 0;

      _whenGetFeed(repo).thenAnswer((_) async {
        calls++;
        if (calls == 1) return _page([_item('1')], cursor: 'bad');
        if (calls == 2) throw const FeedInvalidCursorException();
        return _page([_item('x'), _item('y')]);
      });

      final notifier = _makeNotifier(repo);
      await notifier.load();
      await notifier.loadMore();

      expect(notifier.value.status, FeedStatus.success);
      expect(notifier.value.items.map((i) => i.id).toList(), ['x', 'y']);
    });
  });
}
