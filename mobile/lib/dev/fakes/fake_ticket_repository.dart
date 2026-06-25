// DEV ONLY
// Repositório fake de tickets para testar a aba Tickets sem backend.
// Será removido quando a integração com backend estiver pronta.

import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';

final _agora = DateTime.now();

final _ticketsPadrao = <Ticket>[
  Ticket(
    id: 'tkt_fake_047',
    title: 'Poste apagado na Rua das Flores',
    type: 'iluminacao',
    status: 'em_analise',
    createdAt: DateTime(_agora.year, 4, 24),
    updatedAt: _agora.subtract(const Duration(hours: 2)),
  ),
  Ticket(
    id: 'tkt_fake_046',
    title: 'Buraco na calçada — Av. Colombo',
    type: 'acidente',
    status: 'aberto',
    createdAt: DateTime(_agora.year, 4, 22),
    updatedAt: _agora.subtract(const Duration(hours: 18)),
  ),
  Ticket(
    id: 'tkt_fake_043',
    title: 'Lixo acumulado no final da Rua XV',
    type: 'lixo',
    status: 'reaberto',
    createdAt: DateTime(_agora.year, 4, 18),
    updatedAt: _agora.subtract(const Duration(days: 2)),
  ),
  Ticket(
    id: 'tkt_fake_040',
    title: 'Placa de trânsito tombada',
    type: 'sinalizacao',
    status: 'resolvido',
    createdAt: DateTime(_agora.year, 4, 10),
    updatedAt: _agora.subtract(const Duration(days: 5)),
  ),
  Ticket(
    id: 'tkt_fake_038',
    title: 'Semáforo piscando irregularmente',
    type: 'iluminacao',
    status: 'fechado',
    createdAt: DateTime(_agora.year, 4, 5),
    updatedAt: _agora.subtract(const Duration(days: 1)),
  ),
];

class FakeTicketRepository implements TicketRepository {
  final Duration delay;
  final bool simulateNetworkError;
  final List<Ticket> tickets;

  FakeTicketRepository({
    this.delay = const Duration(milliseconds: 800),
    this.simulateNetworkError = false,
    List<Ticket>? tickets,
  }) : tickets = tickets ?? _ticketsPadrao;

  const FakeTicketRepository.empty({
    this.delay = const Duration(milliseconds: 800),
    this.simulateNetworkError = false,
  }) : tickets = const [];

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
}
