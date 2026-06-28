import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_static_map.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:conectaparana/features/events/presentation/pages/event_detail_page.dart';

class _FakeRepository implements EventRepository {
  final EventDetail? eventToReturn;
  final Exception? errorToThrow;

  _FakeRepository({this.eventToReturn, this.errorToThrow});

  @override
  Future<EventListPage> getEvents({
    String? cityId,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 10,
  }) async {
    return EventListPage(
      items: const [],
      total: 0,
      page: page,
      pageSize: pageSize,
    );
  }

  @override
  Future<EventDetail> getEvent(String id) async {
    if (errorToThrow != null) throw errorToThrow!;
    return eventToReturn!;
  }

  @override
  Future<EngagementResult> toggleLike(String id) async =>
      const EngagementResult(active: true, count: 1);

  @override
  Future<EngagementResult> toggleFavorite(String id) async =>
      const EngagementResult(active: true);
}

DioException _make404Exception() {
  final ro = RequestOptions(path: '/events/evt_404');
  return DioException(
    requestOptions: ro,
    response: Response(
      requestOptions: ro,
      statusCode: 404,
      data: {'code': 'event_not_found', 'message': 'Evento não encontrado'},
    ),
    type: DioExceptionType.badResponse,
  );
}

DioException _makeNetworkException() => DioException(
  requestOptions: RequestOptions(path: '/events/evt_err'),
  type: DioExceptionType.connectionError,
);

EventDetail _makeEvent({
  String status = 'publicado',
  List<EventPhoto> photos = const [],
  EventCoordinates? coordinates,
  EventLocal? local,
  int likesCount = 5,
  bool likedByMe = false,
  bool savedByMe = false,
}) => EventDetail(
  id: 'evt_test',
  title: 'Festa Junina',
  description: 'Uma grande festa com forró ao vivo.',
  type: 'Cultural',
  status: status,
  eventDate: DateTime(2026, 6, 12, 19, 0),
  cityId: 'cit_test',
  coordinates: coordinates,
  local: local,
  photos: photos,
  likesCount: likesCount,
  likedByMe: likedByMe,
  savedByMe: savedByMe,
);

Widget _buildTestWidget(EventDetailPage page) {
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => page),
      GoRoute(
        path: '/map/:id',
        builder: (context, state) =>
            Scaffold(body: Text('local:${state.pathParameters['id']}')),
      ),
    ],
  );
  return MediaQuery(
    data: const MediaQueryData(size: Size(390, 844)),
    child: MaterialApp.router(routerConfig: router),
  );
}

Finder _find(Type t) => find.byType(t, skipOffstage: false);
Finder _text(String s) => find.text(s, skipOffstage: false);
Finder _key(Key k) => find.byKey(k, skipOffstage: false);

void main() {
  group('EventDetailPage', () {
    testWidgets('renderiza título e badge de tipo quando evento carrega', (
      tester,
    ) async {
      final repo = _FakeRepository(eventToReturn: _makeEvent());
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_text('Festa Junina'), findsOneWidget);
      expect(_text('CULTURAL'), findsOneWidget);
    });

    testWidgets('não exibe carrossel quando evento não tem fotos', (
      tester,
    ) async {
      final repo = _FakeRepository(eventToReturn: _makeEvent(photos: []));
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_find(PageView), findsNothing);
    });

    testWidgets('exibe carrossel quando evento tem fotos', (tester) async {
      final photos = [
        const EventPhoto(id: 'pho_1', url: 'https://img.test/1.jpg'),
        const EventPhoto(id: 'pho_2', url: 'https://img.test/2.jpg'),
      ];
      final repo = _FakeRepository(eventToReturn: _makeEvent(photos: photos));
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_find(PageView), findsOneWidget);
    });

    testWidgets('não exibe mapa quando evento não tem coordenadas', (
      tester,
    ) async {
      final repo = _FakeRepository(
        eventToReturn: _makeEvent(coordinates: null),
      );
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_find(EventStaticMap), findsNothing);
    });

    testWidgets('exibe mapa quando evento tem coordenadas', (tester) async {
      const coords = EventCoordinates(lat: -23.45, lng: -51.95);
      final repo = _FakeRepository(
        eventToReturn: _makeEvent(coordinates: coords),
      );
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_find(EventStaticMap), findsOneWidget);
    });

    testWidgets('exibe banner vermelho quando evento está cancelado', (
      tester,
    ) async {
      final repo = _FakeRepository(
        eventToReturn: _makeEvent(status: 'cancelado'),
      );
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_text('Evento cancelado'), findsOneWidget);
    });

    testWidgets('não exibe banner vermelho quando evento não está cancelado', (
      tester,
    ) async {
      final repo = _FakeRepository(
        eventToReturn: _makeEvent(status: 'publicado'),
      );
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_text('Evento cancelado'), findsNothing);
    });

    testWidgets('exibe EmptyState de 404 quando evento não é encontrado', (
      tester,
    ) async {
      final repo = _FakeRepository(errorToThrow: _make404Exception());
      await tester.pumpWidget(
        _buildTestWidget(EventDetailPage(eventId: 'evt_404', repository: repo)),
      );
      await tester.pumpAndSettle();

      expect(_text('Evento não encontrado'), findsOneWidget);
      expect(_text('Voltar'), findsOneWidget);
    });

    testWidgets('exibe erro de rede com botão Tentar novamente', (
      tester,
    ) async {
      final repo = _FakeRepository(errorToThrow: _makeNetworkException());
      await tester.pumpWidget(
        _buildTestWidget(EventDetailPage(eventId: 'evt_err', repository: repo)),
      );
      await tester.pumpAndSettle();

      expect(_text('Não foi possível carregar'), findsOneWidget);
      expect(_text('Tentar novamente'), findsOneWidget);
    });

    testWidgets('exibe botões de engajamento like, salvar e compartilhar', (
      tester,
    ) async {
      final repo = _FakeRepository(eventToReturn: _makeEvent());
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_key(const Key('engagement_like')), findsOneWidget);
      expect(_key(const Key('engagement_save')), findsOneWidget);
      expect(_key(const Key('engagement_share')), findsOneWidget);
    });

    testWidgets('inicia curtir e salvar ativos conforme o evento carregado', (
      tester,
    ) async {
      final repo = _FakeRepository(
        eventToReturn: _makeEvent(
          likedByMe: true,
          savedByMe: true,
          likesCount: 8,
        ),
      );

      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.favorite, skipOffstage: false), findsOneWidget);
      expect(
        find.byIcon(Icons.favorite_border, skipOffstage: false),
        findsNothing,
      );
      expect(find.byIcon(Icons.bookmark, skipOffstage: false), findsWidgets);
      expect(
        find.byIcon(Icons.bookmark_border, skipOffstage: false),
        findsNothing,
      );
      expect(_text('8'), findsOneWidget);
    });

    testWidgets('exibe nome do Local quando evento tem local', (tester) async {
      const local = EventLocal(id: 'loc_test', name: 'Parque do Ingá');
      final repo = _FakeRepository(eventToReturn: _makeEvent(local: local));
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_text('Parque do Ingá'), findsOneWidget);
    });

    testWidgets('contagem de likes exibe o valor correto', (tester) async {
      final repo = _FakeRepository(eventToReturn: _makeEvent(likesCount: 42));
      await tester.pumpWidget(
        _buildTestWidget(
          EventDetailPage(eventId: 'evt_test', repository: repo),
        ),
      );
      await tester.pumpAndSettle();

      expect(_text('42'), findsOneWidget);
    });
  });
}
