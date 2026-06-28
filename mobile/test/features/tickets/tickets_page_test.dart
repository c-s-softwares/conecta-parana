import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';
import 'package:conectaparana/features/tickets/presentation/pages/tickets_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class _FakeRepository implements TicketRepository {
  final List<Ticket>? ticketsToReturn;
  final Exception? errorToThrow;
  int callCount = 0;

  _FakeRepository({this.ticketsToReturn, this.errorToThrow});

  @override
  Future<List<Ticket>> getMyTickets() async {
    callCount++;
    if (errorToThrow != null) throw errorToThrow!;
    return ticketsToReturn ?? const [];
  }

  @override
  Future<TicketDetail> getTicketDetail(String id) async {
    throw UnimplementedError();
  }

  @override
  Future<TicketComment> addComment({
    required String ticketId,
    required String message,
  }) async => throw UnimplementedError();

  @override
  Future<Ticket> createTicket(CreateTicketRequest request) async {
    throw UnimplementedError();
  }

  @override
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  }) async {
    throw UnimplementedError();
  }
}

Ticket _makeTicket({
  String id = 'tkt_1',
  String title = 'Semáforo apagado',
  String type = 'sinalizacao',
  String status = 'em_analise',
  DateTime? createdAt,
  DateTime? updatedAt,
}) {
  final created = createdAt ?? DateTime(2026, 6, 10);
  return Ticket(
    id: id,
    title: title,
    type: type,
    status: status,
    createdAt: created,
    updatedAt: updatedAt ?? created,
  );
}

Widget _buildTestWidget(TicketsPage page) {
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => page),
      GoRoute(
        path: '/tickets/new',
        builder: (context, state) => const Scaffold(body: Text('new-ticket')),
      ),
      GoRoute(
        path: '/tickets/:id',
        builder: (context, state) =>
            Scaffold(body: Text('ticket:${state.pathParameters['id']}')),
      ),
    ],
  );
  return MediaQuery(
    data: const MediaQueryData(size: Size(390, 844)),
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  group('TicketsPage', () {
    testWidgets('renderiza lista de tickets ordenada por createdAt desc', (
      tester,
    ) async {
      final repo = _FakeRepository(
        ticketsToReturn: [
          _makeTicket(
            id: 'tkt_2',
            title: 'Semáforo apagado',
            type: 'sinalizacao',
            status: 'em_analise',
            createdAt: DateTime(2026, 6, 10),
          ),
          _makeTicket(
            id: 'tkt_3',
            title: 'Buraco na rua',
            type: 'outros',
            status: 'resolvido',
            createdAt: DateTime(2026, 6, 5),
          ),
          _makeTicket(
            id: 'tkt_1',
            title: 'Lâmpada queimada',
            type: 'iluminacao',
            status: 'aberto',
            createdAt: DateTime(2026, 6, 2),
          ),
        ],
      );

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('Semáforo apagado'), findsOneWidget);
      expect(find.text('Buraco na rua'), findsOneWidget);
      expect(find.text('Lâmpada queimada'), findsOneWidget);

      final titles = tester
          .widgetList<Text>(
            find.descendant(
              of: find.byType(SliverList),
              matching: find.byWidgetPredicate(
                (w) =>
                    w is Text &&
                    (w.data == 'Semáforo apagado' ||
                        w.data == 'Buraco na rua' ||
                        w.data == 'Lâmpada queimada'),
              ),
            ),
          )
          .map((t) => t.data)
          .toList();

      expect(titles.first, 'Semáforo apagado');
      expect(titles.last, 'Lâmpada queimada');
    });

    testWidgets('exibe tipo, numero, status e data de envio para cada item', (
      tester,
    ) async {
      final repo = _FakeRepository(
        ticketsToReturn: [
          _makeTicket(
            id: 'tkt_047',
            title: 'Semáforo apagado',
            type: 'sinalizacao',
            status: 'em_analise',
            createdAt: DateTime(2026, 4, 24),
          ),
        ],
      );

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('SINALIZAÇÃO'), findsOneWidget);
      expect(find.text('#047'), findsOneWidget);
      expect(find.text('Em análise'), findsWidgets);
      expect(find.textContaining('Enviado 24 abr'), findsOneWidget);
    });

    final statusCases = {
      'aberto': 'Aberto',
      'em_analise': 'Em análise',
      'resolvido': 'Concluído',
      'fechado': 'Concluído',
      'reaberto': 'Respondido',
    };

    for (final entry in statusCases.entries) {
      testWidgets('exibe badge correto para status ${entry.key}', (
        tester,
      ) async {
        final repo = _FakeRepository(
          ticketsToReturn: [_makeTicket(status: entry.key)],
        );

        await tester.pumpWidget(
          _buildTestWidget(TicketsPage(repository: repo)),
        );
        await tester.pumpAndSettle();

        expect(find.text(entry.value), findsWidgets);
      });
    }

    testWidgets('exibe EmptyState quando lista está vazia', (tester) async {
      final repo = _FakeRepository(ticketsToReturn: const []);

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('Você ainda não abriu tickets.'), findsOneWidget);
    });

    testWidgets(
      'exibe estado de erro com botão Tentar novamente em falha de rede',
      (tester) async {
        final repo = _FakeRepository(errorToThrow: TicketNetworkException());

        await tester.pumpWidget(
          _buildTestWidget(TicketsPage(repository: repo)),
        );
        await tester.pumpAndSettle();

        expect(find.text('Não foi possível carregar'), findsOneWidget);
        expect(find.text('Tentar novamente'), findsOneWidget);
      },
    );

    testWidgets('botão Tentar novamente recarrega a lista', (tester) async {
      var shouldFail = true;
      final repo = _FakeRepositoryWithRetry(
        onLoad: () {
          if (shouldFail) {
            shouldFail = false;
            throw TicketNetworkException();
          }
          return [_makeTicket()];
        },
      );

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('Tentar novamente'), findsOneWidget);

      await tester.tap(find.text('Tentar novamente'));
      await tester.pumpAndSettle();

      expect(find.text('Semáforo apagado'), findsOneWidget);
    });

    testWidgets('tap em item navega para o detalhe do ticket', (tester) async {
      final repo = _FakeRepository(ticketsToReturn: [_makeTicket(id: 'tkt_X')]);

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Semáforo apagado'));
      await tester.pumpAndSettle();

      expect(find.text('ticket:tkt_X'), findsOneWidget);
    });

    testWidgets('pull-to-refresh recarrega a lista', (tester) async {
      final repo = _FakeRepository(ticketsToReturn: [_makeTicket()]);

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(repo.callCount, 1);

      await tester.fling(
        find.byType(RefreshIndicator),
        const Offset(0, 300),
        1000,
      );
      await tester.pumpAndSettle();

      expect(repo.callCount, 2);
    });

    testWidgets('botão Abrir novo ticket navega para novo ticket', (
      tester,
    ) async {
      final repo = _FakeRepository(ticketsToReturn: const []);

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('Abrir novo ticket'), findsOneWidget);

      await tester.tap(find.text('Abrir novo ticket'));
      await tester.pumpAndSettle();

      expect(find.text('new-ticket'), findsOneWidget);
    });

    testWidgets('filtros alteram a lista exibida', (tester) async {
      final repo = _FakeRepository(
        ticketsToReturn: [
          _makeTicket(
            id: 'tkt_1',
            title: 'Ticket Aberto',
            status: 'aberto',
            createdAt: DateTime(2026, 6, 10),
          ),
          _makeTicket(
            id: 'tkt_2',
            title: 'Ticket Em Análise',
            status: 'em_analise',
            createdAt: DateTime(2026, 6, 9),
          ),
        ],
      );

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('Ticket Aberto'), findsOneWidget);
      expect(find.text('Ticket Em Análise'), findsOneWidget);

      await tester.tap(
        find
            .descendant(
              of: find.byType(ListView),
              matching: find.text('Abertos'),
            )
            .first,
      );
      await tester.pumpAndSettle();

      expect(find.text('Ticket Aberto'), findsOneWidget);
      expect(find.text('Ticket Em Análise'), findsNothing);
    });

    testWidgets('exibe contadores de resumo por grupo de status', (
      tester,
    ) async {
      final repo = _FakeRepository(
        ticketsToReturn: [
          _makeTicket(id: 'tkt_1', status: 'aberto'),
          _makeTicket(id: 'tkt_2', status: 'em_analise'),
          _makeTicket(id: 'tkt_3', status: 'resolvido'),
          _makeTicket(id: 'tkt_4', status: 'fechado'),
        ],
      );

      await tester.pumpWidget(_buildTestWidget(TicketsPage(repository: repo)));
      await tester.pumpAndSettle();

      expect(find.text('Abertos'), findsWidgets);
      expect(find.text('Concluídos'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });
  });
}

class _FakeRepositoryWithRetry implements TicketRepository {
  final List<Ticket> Function() onLoad;

  _FakeRepositoryWithRetry({required this.onLoad});

  @override
  Future<List<Ticket>> getMyTickets() async => onLoad();

  @override
  Future<TicketDetail> getTicketDetail(String id) async {
    throw UnimplementedError();
  }

  @override
  Future<TicketComment> addComment({
    required String ticketId,
    required String message,
  }) async => throw UnimplementedError();

  @override
  Future<Ticket> createTicket(CreateTicketRequest request) async {
    throw UnimplementedError();
  }

  @override
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  }) async {
    throw UnimplementedError();
  }
}
