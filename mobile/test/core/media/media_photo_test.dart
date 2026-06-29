import 'package:conectaparana/core/media/media_photo.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('faz parsing seguro de url e thumbUrl', () {
    final photos = MediaPhoto.listFromJson([
      {
        'id': 'pho_1',
        'url': 'https://cdn.test/photo.webp',
        'thumbUrl': 'https://cdn.test/photo-thumb.webp',
      },
      null,
      const <String, dynamic>{},
    ]);

    expect(photos, hasLength(1));
    expect(photos.single.fullSizeUrl, 'https://cdn.test/photo.webp');
    expect(photos.single.displayUrl, 'https://cdn.test/photo-thumb.webp');
  });

  test('mantem formato legado em string', () {
    final photos = MediaPhoto.listFromJson(['https://cdn.test/legacy.jpg']);

    expect(photos.single.fullSizeUrl, 'https://cdn.test/legacy.jpg');
    expect(photos.single.displayUrl, 'https://cdn.test/legacy.jpg');
  });

  test('troca localhost pela origem configurada no ambiente de debug', () {
    final photo = MediaPhoto.fromJson({
      'url': 'http://localhost:3000/dev-uploads/photo.webp',
    });

    expect(photo.url, 'http://10.0.2.2:3000/dev-uploads/photo.webp');
  });

  test('array ausente ou vazio nao produz fotos', () {
    expect(MediaPhoto.listFromJson(null), isEmpty);
    expect(MediaPhoto.listFromJson(const []), isEmpty);
  });
}
