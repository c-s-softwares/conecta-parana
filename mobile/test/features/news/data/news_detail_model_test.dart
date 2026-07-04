import 'package:conectaparana/features/news/data/news_detail_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia url e thumbUrl das fotos da noticia', () {
    final news = NewsDetailModel.fromJson({
      'id': 'new_1',
      'title': 'Noticia',
      'photos': [
        {
          'url': 'https://cdn.test/news.webp',
          'thumbUrl': 'https://cdn.test/news-thumb.webp',
        },
      ],
    });

    expect(news.photoItems.single.fullSizeUrl, 'https://cdn.test/news.webp');
    expect(
      news.photoItems.single.displayUrl,
      'https://cdn.test/news-thumb.webp',
    );
    expect(news.photos, ['https://cdn.test/news.webp']);
  });
}
