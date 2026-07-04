// DEV ONLY
// Repositório fake de tickets para testar a aba Tickets sem backend.
// Será removido quando a integração com backend estiver pronta.

import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';

final _agora = DateTime.now();

final _ticketsPadrao = <Ticket>[
  Ticket(
    id: 'tkt_fake_047',
    title: 'Poste apagado na Rua das Flores',
    type: 'iluminacao',
    status: 'em_analise',
    createdAt: DateTime(_agora.year, 4, 24, 14, 32),
    updatedAt: DateTime(_agora.year, 4, 27, 16, 22),
  ),
  Ticket(
    id: 'tkt_fake_046',
    title: 'Buraco na calçada — Av. Colombo',
    type: 'acidente',
    status: 'aberto',
    createdAt: DateTime(_agora.year, 4, 22, 9, 12),
    updatedAt: _agora.subtract(const Duration(hours: 18)),
  ),
  Ticket(
    id: 'tkt_fake_043',
    title: 'Lixo acumulado no final da Rua XV',
    type: 'lixo',
    status: 'reaberto',
    createdAt: DateTime(_agora.year, 4, 18, 16, 40),
    updatedAt: _agora.subtract(const Duration(days: 2)),
  ),
  Ticket(
    id: 'tkt_fake_040',
    title: 'Placa de trânsito tombada',
    type: 'sinalizacao',
    status: 'resolvido',
    createdAt: DateTime(_agora.year, 4, 10, 11, 5),
    updatedAt: _agora.subtract(const Duration(days: 5)),
  ),
  Ticket(
    id: 'tkt_fake_038',
    title: 'Semáforo piscando irregularmente',
    type: 'iluminacao',
    status: 'fechado',
    createdAt: DateTime(_agora.year, 4, 5, 8, 25),
    updatedAt: _agora.subtract(const Duration(days: 1)),
  ),
];

class FakeTicketRepository implements TicketRepository {
  final Duration delay;
  final bool simulateNetworkError;
  final bool simulateCommentError;
  final bool simulateNotFound;
  final bool simulateForbidden;
  final List<Ticket> tickets;
  final Map<String, TicketDetail> _details;

  FakeTicketRepository({
    this.delay = const Duration(milliseconds: 800),
    this.simulateNetworkError = false,
    this.simulateCommentError = false,
    this.simulateNotFound = false,
    this.simulateForbidden = false,
    List<Ticket>? tickets,
    Map<String, TicketDetail>? details,
  })  : tickets = tickets ?? _ticketsPadrao,
        _details = details ?? _defaultDetails();

  const FakeTicketRepository.empty({
    this.delay = const Duration(milliseconds: 800),
    this.simulateNetworkError = false,
    this.simulateCommentError = false,
    this.simulateNotFound = false,
    this.simulateForbidden = false,
  })  : tickets = const [],
        _details = const {};

  @override
  Future<List<Ticket>> getMyTickets() async {
    await Future.delayed(delay);

    if (simulateNetworkError) {
      throw TicketNetworkException();
    }

    final sorted = [...tickets]
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return sorted;
  }

  @override
  Future<TicketDetail> getTicketDetail(String id) async {
    await Future.delayed(delay);

    if (simulateNetworkError) throw TicketNetworkException();
    if (simulateNotFound) throw TicketNotFoundException();
    if (simulateForbidden) throw TicketForbiddenException();

    final detail = _details[id] ?? _details['tkt_fake_047'];
    if (detail == null) throw TicketNotFoundException();
    return detail;
  }

  @override
  Future<TicketComment> addComment({
    required String ticketId,
    required String message,
  }) async {
    await Future.delayed(delay);

    if (simulateCommentError || simulateNetworkError) {
      throw TicketCommentException();
    }

    return TicketComment(
      id: 'tkc_fake_${DateTime.now().millisecondsSinceEpoch}',
      ticketId: ticketId,
      authorId: 'usr_citizen',
      authorName: 'Você',
      author: TicketCommentAuthor.citizen,
      message: message,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<Ticket> createTicket(CreateTicketRequest request) async {
    await Future.delayed(delay);
    if (simulateNetworkError) throw TicketNetworkException();

    final now = DateTime.now();
    final ticket = Ticket(
      id: 'tkt_fake_${now.microsecondsSinceEpoch}',
      title: request.title,
      description: request.description,
      type: request.type,
      status: 'aberto',
      address: request.address,
      createdAt: now,
      updatedAt: now,
    );
    tickets.insert(0, ticket);
    return ticket;
  }

  @override
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  }) async {
    await Future.delayed(delay);
    if (simulateNetworkError) throw TicketNetworkException();
  }
}

Map<String, TicketDetail> _defaultDetails() {
  final main = TicketDetail(
    id: 'tkt_fake_047',
    type: 'iluminacao',
    title: 'Poste apagado na Rua das Flores',
    description:
        'O poste no cruzamento está apagado há 3 dias, causando insegurança à noite na região.',
    status: 'em_analise',
    coordinates: const TicketCoordinates(lat: -23.4253, lng: -51.9386),
    address: 'R. das Flores, 420 — Zona 7, Maringá',
    cityId: 'cit_maringa',
    userId: 'usr_citizen',
    createdAt: DateTime(_agora.year, 4, 24, 14, 32),
    updatedAt: DateTime(_agora.year, 4, 27, 16, 22),
    resolvedAt: DateTime(_agora.year, 4, 27, 16, 22),
    photos: const [TicketPhoto(id: 'pho_fake_001')],
    comments: [
      TicketComment(
        id: 'tkc_fake_001',
        ticketId: 'tkt_fake_047',
        authorId: 'usr_admin',
        authorName: 'Sec. de Obras',
        author: TicketCommentAuthor.admin,
        message: 'Equipe de vistoria agendada. Previsão: 26/04.',
        createdAt: DateTime(_agora.year, 4, 25, 9),
      ),
      TicketComment(
        id: 'tkc_fake_002',
        ticketId: 'tkt_fake_047',
        authorId: 'usr_admin',
        authorName: 'Téc. João Silva',
        author: TicketCommentAuthor.admin,
        message:
            'Vistoria realizada. Troca da lâmpada agendada para amanhã.',
        createdAt: DateTime(_agora.year, 4, 26, 11, 45),
      ),
      TicketComment(
        id: 'tkc_fake_003',
        ticketId: 'tkt_fake_047',
        authorId: 'usr_citizen',
        authorName: 'Você',
        author: TicketCommentAuthor.citizen,
        message:
            'A troca da lâmpada foi realizada. Verifique o local e confirme se o problema foi resolvido.',
        createdAt: DateTime(_agora.year, 4, 27, 8),
      ),
    ],
  );

  final closed = TicketDetail(
    id: 'tkt_fake_038',
    type: 'iluminacao',
    title: 'Semáforo piscando irregularmente',
    description: 'Semáforo intermitente fora do horário esperado.',
    status: 'fechado',
    address: 'Av. Brasil, 123 — Maringá',
    cityId: 'cit_maringa',
    userId: 'usr_citizen',
    createdAt: DateTime(_agora.year, 4, 5, 8, 25),
    updatedAt: DateTime(_agora.year, 4, 6, 10, 15),
    resolvedAt: DateTime(_agora.year, 4, 6, 10, 15),
    photos: const [],
    comments: const [],
  );

  return {main.id: main, closed.id: closed};
}
