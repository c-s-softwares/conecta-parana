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
  });

  factory NewsDetailModel.fromJson(Map<String, dynamic> json) {
    return NewsDetailModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      summary: json['summary'],
      type: json['type'],
      linkType: json['linkType'],
      externalUrl: json['externalUrl'],
      isActive: json['isActive'] ?? true,
      photos: List<String>.from(json['photos'] ?? []),
      authorName: json['authorName'],
      authorSubtitle: json['authorSubtitle'],
      createdAt: json['createdAt'],
    );
  }
}