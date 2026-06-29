import 'media_url_resolver.dart';

class MediaPhoto {
  const MediaPhoto({this.id, this.url, this.thumbUrl});

  final String? id;
  final String? url;
  final String? thumbUrl;

  String? get displayUrl => thumbUrl ?? url;
  String? get fullSizeUrl => url ?? thumbUrl;
  bool get hasImage => displayUrl != null;

  factory MediaPhoto.fromJson(dynamic json) {
    if (json is String) {
      final url = MediaUrlResolver.resolve(json);
      return MediaPhoto(url: url, thumbUrl: url);
    }
    if (json is! Map) return const MediaPhoto();

    return MediaPhoto(
      id: json['id']?.toString(),
      url: MediaUrlResolver.resolve(json['url']),
      thumbUrl: MediaUrlResolver.resolve(json['thumbUrl']),
    );
  }

  static List<MediaPhoto> listFromJson(dynamic value) {
    if (value is! List) return const [];
    return value
        .map(MediaPhoto.fromJson)
        .where((photo) => photo.hasImage)
        .toList(growable: false);
  }
}
