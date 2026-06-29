import 'package:conectaparana/features/home/data/models/feed_item_model.dart';
import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia resposta sectioned do /feed para itens e destaques da Home', () {
    final page = FeedResponseModel.fromJson(
      {
        'mainNews': {
          'id': 'nws_01',
          'title': 'Mutirao de limpeza',
          'description': 'Acao no centro',
          'type': 'geral',
          'updatedAt': '2026-06-20T10:00:00.000Z',
          'photos': [
            {'thumbUrl': 'https://cdn.test/news-thumb.webp'},
          ],
        },
        'events': [
          {
            'id': 'evt_01',
            'title': 'Feira municipal',
            'description': 'Descricao detalhada do evento',
            'address': 'Praca central, 100',
            'type': 'cultural',
            'eventDate': '2026-06-25T19:00:00.000Z',
            'priority': true,
            'likesCount': 7,
            'liked': true,
            'saved': true,
            'photos': [
              {'thumbUrl': 'https://cdn.test/event-thumb.webp'},
            ],
          },
        ],
        'communicates': [
          {
            'id': 'cmt_01',
            'title': 'Rua interditada',
            'description': 'Obra programada',
            'photos': [
              {'thumbUrl': 'https://cdn.test/communicate-thumb.webp'},
            ],
          },
        ],
      },
      categories: [
        {'id': 'cat_01', 'name': 'Saude', 'icon': 'medical-cross'},
      ],
    ).toDomain();

    expect(page.hasMore, isFalse);
    expect(page.items.map((item) => item.type), [FeedItemType.comunicado]);
    expect(page.items.single.detailRoute, '/home/comunicado/cmt_01');
    expect(page.highlights.featuredBanner?.detailRoute, '/home/news/nws_01');
    expect(
      page.highlights.featuredBanner?.photos.single.displayUrl,
      'https://cdn.test/news-thumb.webp',
    );
    expect(page.highlights.events.single.detailRoute, '/events/evt_01');
    expect(page.highlights.events.single.location, 'Praca central, 100');
    expect(page.highlights.events.single.likesCount, 7);
    expect(page.highlights.events.single.liked, isTrue);
    expect(page.highlights.events.single.saved, isTrue);
    expect(
      page.highlights.events.single.photos.single.displayUrl,
      'https://cdn.test/event-thumb.webp',
    );
    expect(
      page.items.single.photos.single.displayUrl,
      'https://cdn.test/communicate-thumb.webp',
    );
    expect(
      page.highlights.events.single.location,
      isNot('Descricao detalhada do evento'),
    );
    expect(page.highlights.services.single.icon, 'medical-cross');
  });

  test('usa fallback quando o endereco do evento nao esta disponivel', () {
    final page = FeedResponseModel.fromJson({
      'events': [
        {
          'id': 'evt_02',
          'title': 'Evento sem local',
          'description': 'Esta descricao nao deve aparecer como endereco',
          'type': 'cultural',
          'eventDate': '2026-06-25T19:00:00.000Z',
        },
      ],
    }).toDomain();

    expect(page.highlights.events.single.location, 'Local a definir');
  });
}
