import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TicketDetail', () {
    test('mapeia contrato real da API de tickets', () {
      final ticket = TicketDetail.fromJson({
        'id': 'tkt_123456',
        'type': 'sinalização',
        'title': 'Semaforo apagado',
        'description': 'Semaforo apagado na avenida principal.',
        'status': 'em_analise',
        'coordinates': {'lat': -23.42, 'lng': -51.93},
        'address': 'Av. Brasil, 1000',
        'cityId': 'cit_1',
        'userId': 'usr_1',
        'assignedToId': 'usr_admin',
        'assignedToName': 'Carlos Lima',
        'createdAt': '2026-06-10T13:00:00.000Z',
        'updatedAt': '2026-06-10T14:00:00.000Z',
        'resolvedAt': null,
        'photos': [
          {
            'id': 'pho_1',
            'url': 'https://cdn.test/ticket.webp',
            'thumbUrl': 'https://cdn.test/ticket-thumb.webp',
          },
        ],
        'comments': [
          {
            'id': 'tkc_1',
            'ticketId': 'tkt_123456',
            'authorId': 'usr_admin',
            'authorName': 'Ana Souza',
            'message': 'Equipe acionada.',
            'createdAt': '2026-06-10T14:05:00.000Z',
            'photos': [
              {
                'id': 'pho_2',
                'url': 'https://cdn.test/update.webp',
                'thumbUrl': 'https://cdn.test/update-thumb.webp',
              },
            ],
          },
        ],
      });

      expect(ticket.id, 'tkt_123456');
      expect(ticket.type, 'sinalização');
      expect(ticket.coordinates?.lat, -23.42);
      expect(ticket.photos.single.id, 'pho_1');
      expect(
        ticket.photos.single.displayUrl,
        'https://cdn.test/ticket-thumb.webp',
      );
      expect(ticket.comments.single.message, 'Equipe acionada.');
      expect(ticket.comments.single.authorName, 'Ana Souza');
      expect(ticket.assignedToName, 'Carlos Lima');
      expect(
        ticket.comments.single.photos.single.fullSizeUrl,
        'https://cdn.test/update.webp',
      );
    });
  });
}
