class NewsDetailModel {
  final String id;
  final String title;
  final String? description;
  final String? summary;
  final String? type;
  final String? linkType;
  final String? externalUrl;
  final bool isActive;
  final List<String> photos;
  final String? authorName;
  final String? authorSubtitle;
  final String? createdAt;
  final int likesCount;
  final bool liked;
  final bool saved;

  NewsDetailModel({
    required this.id,
    required this.title,
    this.description,
    this.summary,
    this.type,
    this.linkType,
    this.externalUrl,
    required this.isActive,
    required this.photos,
    this.authorName,
    this.authorSubtitle,
    this.createdAt,
    this.likesCount = 0,
    this.liked = false,
    this.saved = false,
  });

  factory NewsDetailModel.fromJson(Map<String, dynamic> json) {
    return NewsDetailModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      summary: json['summary'],
      type: json['type'],
      linkType: json['linkType'],
      externalUrl: json['linkUrl'] ?? json['externalUrl'],
      isActive: json['isActive'] ?? true,
      photos: (json['photos'] as List<dynamic>? ?? const [])
          .map((photo) => photo is Map<String, dynamic> ? photo['url'] : photo)
          .whereType<String>()
          .toList(),
      authorName: json['authorName'],
      authorSubtitle: json['authorSubtitle'],
      createdAt: json['createdAt'],
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
    );
  }
}
