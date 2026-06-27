class CommunicateDetailModel {
  final String id;
  final String title;
  final String description;
  final String authorName;
  final String city;
  final DateTime publishedAt;
  final bool isActive;
  final List<String> photos;

  CommunicateDetailModel({
    required this.id,
    required this.title,
    required this.description,
    required this.authorName,
    required this.city,
    required this.publishedAt,
    required this.isActive,
    required this.photos,
  });

  factory CommunicateDetailModel.fromJson(Map<String, dynamic> json) {
    return CommunicateDetailModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      authorName: json['authorName'] ?? '',
      city: json['city'] ?? '',
      publishedAt: DateTime.parse(json['publishedAt']),
      isActive: json['isActive'] ?? true,
      photos: List<String>.from(json['photos'] ?? []),
    );
  }
}