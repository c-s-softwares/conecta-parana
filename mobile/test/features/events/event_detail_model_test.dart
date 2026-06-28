import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia liked e saved do contrato real de detalhe de evento', () {
    final event = EventDetail.fromJson({
      'id': 'evt_01',
      'title': 'Feira municipal',
      'description': 'Evento aberto ao publico',
      'type': 'cultural',
      'isActive': true,
      'eventDate': '2026-06-25T19:00:00.000Z',
      'cityId': 'cit_01',
      'likesCount': 12,
      'liked': true,
      'saved': true,
    });

    expect(event.status, 'publicado');
    expect(event.likesCount, 12);
    expect(event.likedByMe, isTrue);
    expect(event.savedByMe, isTrue);
  });

  test('mantem aliases defensivos sem sobrescrever valores verdadeiros', () {
    final event = EventDetail.fromJson({
      'id': 'evt_02',
      'title': 'Evento',
      'description': 'Descricao',
      'type': 'cultural',
      'status': 'publicado',
      'eventDate': '2026-06-25T19:00:00.000Z',
      'cityId': 'cit_01',
      'isLiked': true,
      'isSaved': true,
    });

    expect(event.likedByMe, isTrue);
    expect(event.savedByMe, isTrue);
  });
}
