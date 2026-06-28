import 'package:conectaparana/features/communicates/data/communicate_detail_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia metadados e topicos explicitos do detalhe', () {
    final item = CommunicateDetailModel.fromJson({
      'id': 'cmt_1',
      'title': 'Comunicado',
      'description': 'Texto principal',
      'authorName': 'Prefeitura',
      'city': {'name': 'Curitiba'},
      'uf': 'PR',
      'category': 'Coleta',
      'createdAt': '2026-05-08T09:14:00.000Z',
      'highlights': ['Primeiro ponto', 'Segundo ponto'],
      'liked': true,
      'saved': true,
    });

    expect(item.cityName, 'Curitiba');
    expect(item.stateCode, 'PR');
    expect(item.category, 'Coleta');
    expect(item.highlights, ['Primeiro ponto', 'Segundo ponto']);
    expect(item.liked, isTrue);
    expect(item.saved, isTrue);
  });

  test('extrai bullets do texto sem repeti-los no corpo', () {
    final item = CommunicateDetailModel.fromJson({
      'description':
          'O QUE MUDA\n- Primeiro ponto\n• Segundo ponto\n\nCorpo final.',
    });

    expect(item.highlights, ['Primeiro ponto', 'Segundo ponto']);
    expect(item.paragraphs, ['Corpo final.']);
  });
}
