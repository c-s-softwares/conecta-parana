import 'dart:typed_data';

import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';
import 'package:conectaparana/features/tickets/presentation/pages/new_ticket_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class _FakeTicketRepository implements TicketRepository {
  Exception? createError;
  Exception? uploadError;
  int createCount = 0;
  int uploadCount = 0;
  CreateTicketRequest? lastRequest;

  @override
  Future<List<Ticket>> getMyTickets() async => const [];

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
    createCount++;
    lastRequest = request;
    if (createError != null) throw createError!;

    return Ticket(
      id: 'tkt_created',
      title: request.title,
      description: request.description,
      type: request.type,
      status: 'aberto',
      createdAt: DateTime(2026, 6, 24),
      updatedAt: DateTime(2026, 6, 24),
    );
  }

  @override
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  }) async {
    uploadCount++;
    if (uploadError != null) throw uploadError!;
  }
}

class _FakeMediaPicker implements NewTicketMediaPicker {
  Exception? error;
  int callCount = 0;

  @override
  Future<NewTicketPhoto?> pickPhoto(NewTicketPhotoSource source) async {
    callCount++;
    if (error != null) throw error!;

    return NewTicketPhoto(
      bytes: _pngBytes,
      fileName: 'foto.png',
      mimeType: 'image/png',
    );
  }
}

Widget _buildTestWidget({
  required _FakeTicketRepository repository,
  _FakeMediaPicker? mediaPicker,
}) {
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => NewTicketPage(
          repository: repository,
          mediaPicker: mediaPicker ?? _FakeMediaPicker(),
        ),
      ),
      GoRoute(
        path: '/tickets/:id',
        builder: (context, state) =>
            Scaffold(body: Text('ticket:${state.pathParameters['id']}')),
      ),
    ],
  );

  return MaterialApp.router(routerConfig: router);
}

Future<void> _fillValidForm(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('new_ticket_type_iluminação')));
  await tester.enterText(
    find.byKey(const Key('new_ticket_title_field')),
    'Poste apagado',
  );
  await tester.enterText(
    find.byKey(const Key('new_ticket_description_field')),
    'Poste apagado ha tres dias.',
  );
  await tester.enterText(
    find.byKey(const Key('new_ticket_address_field')),
    'Rua São João, Jd. São Pedro - próximo ao hospital',
  );
  await tester.pumpAndSettle();
}

Future<void> _addGalleryPhoto(WidgetTester tester) async {
  await tester.ensureVisible(
    find.byKey(const Key('new_ticket_add_photo_button')),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const Key('new_ticket_add_photo_button')));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Galeria'));
  await tester.pumpAndSettle();
}

void main() {
  group('NewTicketPage', () {
    testWidgets('valida campos e habilita botao Enviar', (tester) async {
      final repo = _FakeTicketRepository();

      await tester.pumpWidget(_buildTestWidget(repository: repo));
      await tester.pumpAndSettle();

      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('new_ticket_submit_button')),
      );
      expect(button.onPressed, isNull);

      await tester.enterText(
        find.byKey(const Key('new_ticket_title_field')),
        'abc',
      );
      await tester.enterText(
        find.byKey(const Key('new_ticket_description_field')),
        'curta',
      );
      await tester.pumpAndSettle();

      expect(
        find.text('Título deve ter pelo menos 5 caracteres.'),
        findsOneWidget,
      );
      expect(
        find.text('Descrição deve ter pelo menos 10 caracteres.'),
        findsOneWidget,
      );

      await _fillValidForm(tester);

      final enabledButton = tester.widget<ElevatedButton>(
        find.byKey(const Key('new_ticket_submit_button')),
      );
      expect(enabledButton.onPressed, isNotNull);
    });

    testWidgets('exibe dialog quando camera e negada', (tester) async {
      final repo = _FakeTicketRepository();
      final media = _FakeMediaPicker()
        ..error = const NewTicketPermissionDeniedException(
          NewTicketPhotoSource.camera,
        );

      await tester.pumpWidget(
        _buildTestWidget(repository: repo, mediaPicker: media),
      );
      await tester.pumpAndSettle();

      await tester.ensureVisible(
        find.byKey(const Key('new_ticket_add_photo_button')),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('new_ticket_add_photo_button')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Câmera'));
      await tester.pumpAndSettle();

      expect(find.text('Câmera necessária para tirar fotos.'), findsOneWidget);
      expect(find.text('Abrir configurações'), findsOneWidget);
    });

    testWidgets('fluxo feliz cria ticket, sobe foto e navega para detalhe', (
      tester,
    ) async {
      final repo = _FakeTicketRepository();

      await tester.pumpWidget(_buildTestWidget(repository: repo));
      await tester.pumpAndSettle();

      await _fillValidForm(tester);
      await _addGalleryPhoto(tester);

      await tester.ensureVisible(
        find.byKey(const Key('new_ticket_submit_button')),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('new_ticket_submit_button')));
      await tester.pumpAndSettle();

      expect(repo.createCount, 1);
      expect(repo.uploadCount, 1);
      expect(repo.lastRequest?.type, 'iluminação');
      expect(
        repo.lastRequest?.address,
        'Rua São João, Jd. São Pedro - próximo ao hospital',
      );
      expect(find.text('ticket:tkt_created'), findsOneWidget);
      expect(find.text('Ticket aberto!'), findsOneWidget);
    });

    testWidgets('erro 503 no upload mantem sucesso do ticket', (tester) async {
      final repo = _FakeTicketRepository()
        ..uploadError = TicketStorageUnavailableException();

      await tester.pumpWidget(_buildTestWidget(repository: repo));
      await tester.pumpAndSettle();

      await _fillValidForm(tester);
      await _addGalleryPhoto(tester);

      await tester.ensureVisible(
        find.byKey(const Key('new_ticket_submit_button')),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('new_ticket_submit_button')));
      await tester.pumpAndSettle();

      expect(repo.createCount, 1);
      expect(repo.uploadCount, 1);
      expect(find.text('ticket:tkt_created'), findsOneWidget);
      expect(
        find.text('Ticket aberto. Algumas fotos não foram enviadas.'),
        findsOneWidget,
      );
    });

    testWidgets('falha de rede no submit preserva formulario', (tester) async {
      final repo = _FakeTicketRepository()
        ..createError = TicketNetworkException();

      await tester.pumpWidget(_buildTestWidget(repository: repo));
      await tester.pumpAndSettle();

      await _fillValidForm(tester);

      await tester.ensureVisible(
        find.byKey(const Key('new_ticket_submit_button')),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('new_ticket_submit_button')));
      await tester.pumpAndSettle();

      expect(
        find.text('Erro de conexão. Verifique sua internet e tente novamente.'),
        findsOneWidget,
      );
      expect(find.text('Poste apagado'), findsOneWidget);
      expect(find.text('Poste apagado ha tres dias.'), findsOneWidget);
    });
  });
}

final _pngBytes = Uint8List.fromList(const [
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0A,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0x00,
  0x01,
  0x00,
  0x00,
  0x05,
  0x00,
  0x01,
  0x0D,
  0x0A,
  0x2D,
  0xB4,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82,
]);
