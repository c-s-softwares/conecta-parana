import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';
import 'package:conectaparana/features/events/presentation/pages/events_page.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_featured_banner.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/shared/widgets/misc/section_header.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeEventRepository implements EventRepository {
  final List<EventListItem> items;
  final bool throwsOnLoad;
  int calls = 0;
  DateTime? lastFrom;
  DateTime? lastTo;
  String? lastCityId;

  _FakeEventRepository({this.items = const [], this.throwsOnLoad = false});

  @override
  Future<EventListPage> getEvents({
    String? cityId,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 10,
  }) async {
    calls++;
    lastCityId = cityId;
    lastFrom = from;
    lastTo = to;
    if (throwsOnLoad) throw EventNetworkException();
    return EventListPage(
      items: items,
      total: items.length,
      page: page,
      pageSize: pageSize,
    );
  }

  @override
  Future<EventDetail> getEvent(String id) => throw UnimplementedError();

  @override
  Future<EngagementResult> toggleFavorite(String id) =>
      throw UnimplementedError();

  @override
  Future<EngagementResult> toggleLike(String id) => throw UnimplementedError();
}

EventListItem _event(String id) {
  return EventListItem(
    id: id,
    title: 'Evento $id',
    category: 'cultural',
    date: DateTime(2026, 6, 20, 19),
    time: '19:00',
    location: 'Local',
    detailRoute: '/events/$id',
  );
}

Widget _wrap(
  EventRepository repository, {
  ValueListenable<City?>? activeCityListenable,
}) {
  return MaterialApp(
    home: EventsPage(
      repository: repository,
      activeCityListenable: activeCityListenable,
    ),
  );
}

EventListItem _eventWithLocation(String location) => EventListItem(
  id: 'evt_long_location',
  title: 'Evento em destaque',
  category: 'cultural',
  date: DateTime(2026, 6, 20, 19),
  time: '19:00',
  location: location,
  detailRoute: '/events/evt_long_location',
);

Finder _verticalListView() => find.byWidgetPredicate(
  (widget) =>
      widget is ListView &&
      widget.scrollDirection == Axis.vertical &&
      widget.physics is AlwaysScrollableScrollPhysics,
);

void main() {
  testWidgets('renderiza eventos carregados da API', (tester) async {
    final repo = _FakeEventRepository(
      items: [_event('evt_1'), _event('evt_2')],
    );

    await tester.pumpWidget(_wrap(repo));
    await tester.pumpAndSettle();

    expect(find.text('Evento evt_1'), findsWidgets);
    expect(find.text('Evento evt_2'), findsWidgets);
  });

  testWidgets('mostra estado vazio quando nao ha eventos', (tester) async {
    final repo = _FakeEventRepository();

    await tester.pumpWidget(_wrap(repo));
    await tester.pumpAndSettle();

    expect(find.text('Nenhum evento encontrado'), findsOneWidget);
  });

  testWidgets('mostra erro quando carregamento falha', (tester) async {
    final repo = _FakeEventRepository(throwsOnLoad: true);

    await tester.pumpWidget(_wrap(repo));
    await tester.pumpAndSettle();

    expect(find.text('Nao foi possivel carregar os eventos'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);
  });

  testWidgets('pull-to-refresh recarrega eventos', (tester) async {
    final repo = _FakeEventRepository(items: [_event('evt_1')]);

    await tester.pumpWidget(_wrap(repo));
    await tester.pumpAndSettle();

    await tester.fling(_verticalListView(), const Offset(0, 400), 1000);
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(repo.calls, greaterThanOrEqualTo(2));
  });

  testWidgets('troca de cidade recarrega eventos com o novo id', (
    tester,
  ) async {
    final repo = _FakeEventRepository(items: [_event('evt_1')]);
    final activeCity = ValueNotifier<City?>(
      const City(id: 'cit_01KW62B7AYZNW0KF896RH3JJ82', name: 'Maringa'),
    );
    addTearDown(activeCity.dispose);

    await tester.pumpWidget(_wrap(repo, activeCityListenable: activeCity));
    await tester.pumpAndSettle();

    expect(repo.calls, 1);
    expect(repo.lastCityId, 'cit_01KW62B7AYZNW0KF896RH3JJ82');
    expect(find.text('MARINGA'), findsOneWidget);

    activeCity.value = const City(
      id: 'cit_01KW62B7B0F4TQQ6MVCMZKKF3E',
      name: 'Curitiba',
    );
    await tester.pump();
    await tester.pumpAndSettle();

    expect(repo.calls, 2);
    expect(repo.lastCityId, 'cit_01KW62B7B0F4TQQ6MVCMZKKF3E');
    expect(find.text('CURITIBA'), findsOneWidget);
  });

  testWidgets('Ver tudo de Esta semana reaproveita lista com filtro semanal', (
    tester,
  ) async {
    final repo = _FakeEventRepository(
      items: [_event('evt_1'), _event('evt_2'), _event('evt_3')],
    );

    await tester.pumpWidget(_wrap(repo));
    await tester.pumpAndSettle();

    expect(repo.lastFrom, isNull);
    expect(repo.lastTo, isNull);

    await tester.tap(
      find.descendant(
        of: find.widgetWithText(SectionHeader, 'Esta semana'),
        matching: find.text('Ver tudo'),
      ),
    );
    await tester.pumpAndSettle();

    expect(repo.calls, 2);
    expect(repo.lastFrom, isNotNull);
    expect(repo.lastTo, isNotNull);
    expect(find.widgetWithText(SectionHeader, 'Esta semana'), findsNothing);
    expect(find.widgetWithText(SectionHeader, 'Resultados'), findsOneWidget);
  });

  testWidgets('local longo no destaque nao gera overflow', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 280,
            child: EventFeaturedBanner(
              event: _eventWithLocation(
                'Avenida muito extensa, numero 1234, Jardim Sao Pedro',
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    final location = tester.widget<Text>(
      find.textContaining('Avenida muito extensa'),
    );
    expect(location.overflow, TextOverflow.ellipsis);
    expect(location.maxLines, 1);
  });
}
