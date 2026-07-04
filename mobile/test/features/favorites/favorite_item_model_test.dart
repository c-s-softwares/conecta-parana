import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia categoria e data do evento salvo', () {
    final item = FavoriteItemModel.fromJson({
      'id': 'evt_1',
      'title': 'Aniversário de Maringá',
      'type': 'cultura',
      'eventDate': '2026-05-10T18:00:00.000Z',
      'isActive': true,
    }, fallbackType: FavoriteItemType.event);

    expect(item.tagLabel, 'EVENTO • CULTURA');
    expect(item.metadataLabel, '10 mai');
  });

  test('nao expoe categoryId tecnico de local', () {
    final item = FavoriteItemModel.fromJson({
      'id': 'loc_1',
      'name': 'UBS Zona 7',
      'categoryId': 'cat_01HZTECHNICAL',
    }, fallbackType: FavoriteItemType.local);

    expect(item.tagLabel, 'LOCAL');
    expect(item.tagLabel, isNot(contains('cat_')));
    expect(item.metadataLabel, 'Salvo');
  });
}
