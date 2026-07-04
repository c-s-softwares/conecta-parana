import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';
import 'package:conectaparana/features/tickets/presentation/pages/ticket_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class _FakeDetailRepository implements TicketRepository {
  TicketDetail? detail;
  Exception? loadError;
  Exception? commentError;
  int commentsSent = 0;

  _FakeDetailRepository({this.detail, this.loadError, this.commentError});

  @override
  Future<List<Ticket>> getMyTickets() async => const [];

  @override
  Future<TicketDetail> getTicketDetail(String id) async {
    if (loadError != null) throw loadError!;
    return detail ?? _makeDetail(id: id);
  }

  @override
  Future<TicketComment> addComment({
    required String ticketId,
    required String message,
  }) async {
    commentsSent++;
    if (commentError != null) throw commentError!;
    return TicketComment(
      id: 'tkc_saved_$commentsSent',
      ticketId: ticketId,
      authorId: 'usr_citizen',
      authorName: 'Você',
      author: TicketCommentAuthor.citizen,
      message: message,
      createdAt: DateTime(2026, 6, 12, 8),
    );
  }

  @override
  Future<Ticket> createTicket(CreateTicketRequest request) async =>
      throw UnimplementedError();

  @override
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  }) async => throw UnimplementedError();
}

TicketDetail _makeDetail({
  String id = 'tkt_047',
  String status = 'em_analise',
  List<TicketPhoto> photos = const [TicketPhoto(id: 'pho_1')],
  List<TicketComment>? comments,
  DateTime? resolvedAt,
  String? address = 'Av. Brasil, 123',
}) {
  return TicketDetail(
    id: id,
    type: 'sinalizacao',
    title: 'Semáforo apagado',
    description: 'Semáforo apagado na esquina com a Rua X.',
    status: status,
    coordinates: const TicketCoordinates(lat: -23.42, lng: -51.93),
    address: address,
    cityId: 'cit_maringa',
    userId: 'usr_citizen',
    createdAt: DateTime(2026, 6, 10, 9, 32),
    updatedAt: DateTime(2026, 6, 12, 8),
    resolvedAt: resolvedAt,
    photos: photos,
    comments:
        comments ??
        [
          TicketComment(
            id: 'tkc_admin',
            ticketId: id,
            authorId: 'usr_admin',
            authorName: 'Admin',
            author: TicketCommentAuthor.admin,
            message: 'Equipe técnica foi acionada.',
            createdAt: DateTime(2026, 6, 11, 14, 10),
          ),
          TicketComment(
            id: 'tkc_user',
            ticketId: id,
            authorId: 'usr_citizen',
            authorName: 'Você',
            author: TicketCommentAuthor.citizen,
            message: 'Ainda apagado hoje cedo.',
            createdAt: DateTime(2026, 6, 12, 8),
          ),
        ],
  );
}

Future<void> _scrollUntilVisible(WidgetTester tester, Finder finder) async {
  final scrollView = find.byType(CustomScrollView);

  for (var i = 0; i < 20; i++) {
    await tester.pump();

    if (finder.evaluate().isNotEmpty) {
      return;
    }

    await tester.drag(scrollView, const Offset(0, -300));
    await tester.pumpAndSettle();
  }

  expect(
    finder,
    findsOneWidget,
    reason: 'Widget não encontrado após rolar a tela.',
  );
}

Widget _buildPage(_FakeDetailRepository repo) {
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) =>
            TicketDetailPage(ticketId: 'tkt_047', repository: repo),
      ),
    ],
  );

  return MediaQuery(
    data: const MediaQueryData(size: Size(390, 844)),
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  group('TicketDetailPage', () {
    testWidgets('renderiza header com fotos e timeline', (tester) async {
      final repo = _FakeDetailRepository(detail: _makeDetail());

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      expect(find.text('SINALIZAÇÃO'), findsOneWidget);
      expect(find.text('Semáforo apagado'), findsOneWidget);
      expect(find.text('Em análise'), findsOneWidget);
      expect(find.byKey(const Key('ticket-photo-carousel')), findsOneWidget);
      expect(
        find.text('Semáforo apagado na esquina com a Rua X.'),
        findsOneWidget,
      );

      await _scrollUntilVisible(tester, find.text('HISTÓRICO DE ATUALIZAÇÕES'));
      expect(find.text('HISTÓRICO DE ATUALIZAÇÕES'), findsOneWidget);
      expect(find.text('Equipe técnica foi acionada.'), findsOneWidget);
    });

    testWidgets('renderiza sem carrossel quando não tem fotos', (tester) async {
      final repo = _FakeDetailRepository(detail: _makeDetail(photos: const []));

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      expect(find.text('Semáforo apagado'), findsOneWidget);
      expect(find.byKey(const Key('ticket-photo-carousel')), findsNothing);
    });

    testWidgets('timeline fica em ordem cronológica', (tester) async {
      final repo = _FakeDetailRepository(
        detail: _makeDetail(
          comments: [
            TicketComment(
              id: 'newer',
              ticketId: 'tkt_047',
              authorId: 'usr_citizen',
              authorName: 'Você',
              author: TicketCommentAuthor.citizen,
              message: 'Comentário mais recente',
              createdAt: DateTime(2026, 6, 12, 8),
            ),
            TicketComment(
              id: 'older',
              ticketId: 'tkt_047',
              authorId: 'usr_admin',
              authorName: 'Admin',
              author: TicketCommentAuthor.admin,
              message: 'Comentário mais antigo',
              createdAt: DateTime(2026, 6, 11, 8),
            ),
          ],
        ),
      );

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      await _scrollUntilVisible(tester, find.text('Ticket criado'));

      final createdY = tester.getTopLeft(find.text('Ticket criado')).dy;
      final olderY = tester.getTopLeft(find.text('Comentário mais antigo')).dy;
      final newerY = tester.getTopLeft(find.text('Comentário mais recente')).dy;

      expect(createdY, lessThan(olderY));
      expect(olderY, lessThan(newerY));
    });

    testWidgets('envio de comentário adiciona na timeline e limpa input', (
      tester,
    ) async {
      final repo = _FakeDetailRepository(detail: _makeDetail());

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('ticket-comment-input')),
        'Continua apagado',
      );
      await tester.pump();
      await tester.tap(find.byKey(const Key('send-comment-button')));
      await tester.pumpAndSettle();

      expect(repo.commentsSent, 1);
      await _scrollUntilVisible(tester, find.text('Continua apagado'));
      expect(find.text('Continua apagado'), findsOneWidget);
      final input = tester.widget<TextField>(
        find.byKey(const Key('ticket-comment-input')),
      );
      expect(input.controller?.text, isEmpty);
    });

    testWidgets('falha ao enviar comentário reverte e preserva texto', (
      tester,
    ) async {
      final repo = _FakeDetailRepository(
        detail: _makeDetail(),
        commentError: TicketCommentException(),
      );

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('ticket-comment-input')),
        'Continua apagado',
      );
      await tester.pump();
      await tester.tap(find.byKey(const Key('send-comment-button')));
      await tester.pumpAndSettle();

      expect(
        find.text('Não foi possível enviar. Tente novamente.'),
        findsOneWidget,
      );
      final input = tester.widget<TextField>(
        find.byKey(const Key('ticket-comment-input')),
      );
      expect(input.controller?.text, 'Continua apagado');
    });

    testWidgets('404 exibe EmptyState de ticket não encontrado', (
      tester,
    ) async {
      final repo = _FakeDetailRepository(loadError: TicketNotFoundException());

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      expect(find.text('Ticket não encontrado'), findsOneWidget);
      expect(find.text('Voltar'), findsOneWidget);
    });

    testWidgets('403 exibe EmptyState de acesso negado', (tester) async {
      final repo = _FakeDetailRepository(loadError: TicketForbiddenException());

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      expect(find.text('Você não tem acesso a este ticket'), findsOneWidget);
      expect(find.text('Voltar'), findsOneWidget);
    });

    testWidgets('status fechado desabilita input de comentário', (
      tester,
    ) async {
      final repo = _FakeDetailRepository(
        detail: _makeDetail(
          status: 'fechado',
          resolvedAt: DateTime(2026, 6, 12),
        ),
      );

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      expect(find.text('Este ticket está fechado.'), findsOneWidget);
      final sendButton = tester.widget<ElevatedButton>(
        find.byKey(const Key('send-comment-button')),
      );
      expect(sendButton.onPressed, isNull);
    });

    testWidgets('acao de mapa exibe aviso do escopo MVP', (tester) async {
      final repo = _FakeDetailRepository(detail: _makeDetail());

      await tester.pumpWidget(_buildPage(repo));
      await tester.pumpAndSettle();

      await _scrollUntilVisible(
        tester,
        find.byKey(const Key('open-maps-button')),
      );
      await tester.tap(find.byKey(const Key('open-maps-button')));
      await tester.pump();

      expect(
        find.text('A função de mapa estará disponível em breve!'),
        findsOneWidget,
      );
    });
  });
}
