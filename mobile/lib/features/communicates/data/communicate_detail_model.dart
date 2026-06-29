import 'package:conectaparana/core/media/media_photo.dart';

class CommunicateDetailModel {
  const CommunicateDetailModel({
    required this.id,
    required this.title,
    required this.description,
    required this.authorName,
    required this.isActive,
    required this.photos,
    this.photoItems = const [],
    required this.likesCount,
    required this.liked,
    required this.saved,
    this.cityName,
    this.stateCode,
    this.category,
    this.createdAt,
    this.shareCount,
    this.highlights = const [],
  });

  final String id;
  final String title;
  final String description;
  final String authorName;
  final bool isActive;
  final List<String> photos;
  final List<MediaPhoto> photoItems;
  final int likesCount;
  final bool liked;
  final bool saved;
  final String? cityName;
  final String? stateCode;
  final String? category;
  final DateTime? createdAt;
  final int? shareCount;
  final List<String> highlights;

  List<String> get paragraphs {
    final withoutBullets = description
        .split('\n')
        .where((line) {
          final normalized = line.trim();
          return normalized.isNotEmpty &&
              normalized.toUpperCase() != 'O QUE MUDA' &&
              !_isBullet(normalized);
        })
        .join('\n');
    return withoutBullets
        .split(RegExp(r'\n\s*\n|\n'))
        .map((paragraph) => paragraph.trim())
        .where((paragraph) => paragraph.isNotEmpty)
        .toList(growable: false);
  }

  factory CommunicateDetailModel.fromJson(Map<String, dynamic> json) {
    final description = json['description'] as String? ?? '';
    final city = json['city'];
    final photoItems = MediaPhoto.listFromJson(json['photos']);
    return CommunicateDetailModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: description,
      authorName: json['authorName'] as String? ?? 'Prefeitura Municipal',
      isActive: json['isActive'] as bool? ?? true,
      photos: photoItems
          .map((photo) => photo.fullSizeUrl)
          .whereType<String>()
          .toList(growable: false),
      photoItems: photoItems,
      likesCount: json['likesCount'] as int? ?? 0,
      liked:
          json['liked'] as bool? ??
          json['isLiked'] as bool? ??
          json['likedByMe'] as bool? ??
          false,
      saved:
          json['saved'] as bool? ??
          json['isSaved'] as bool? ??
          json['savedByMe'] as bool? ??
          false,
      cityName:
          json['cityName'] as String? ??
          (city is Map<String, dynamic> ? city['name'] as String? : null),
      stateCode:
          json['stateCode'] as String? ??
          json['state'] as String? ??
          json['uf'] as String?,
      category:
          json['categoryName'] as String? ??
          json['category'] as String? ??
          json['type'] as String?,
      createdAt: DateTime.tryParse(
        (json['publishedAt'] ?? json['createdAt'] ?? '').toString(),
      ),
      shareCount: json['shareCount'] as int?,
      highlights: _parseHighlights(json, description),
    );
  }

  static List<String> _parseHighlights(
    Map<String, dynamic> json,
    String description,
  ) {
    final explicit = json['highlights'] ?? json['topics'];
    if (explicit is List) {
      return explicit
          .map((item) => item.toString().trim())
          .where((item) => item.isNotEmpty)
          .toList(growable: false);
    }

    return description
        .split('\n')
        .map((line) => line.trim())
        .where(_isBullet)
        .map((line) => line.replaceFirst(RegExp(r'^[-*•]\s*'), '').trim())
        .where((line) => line.isNotEmpty)
        .toList(growable: false);
  }

  static bool _isBullet(String line) {
    return RegExp(r'^[-*•]\s+').hasMatch(line);
  }
}
