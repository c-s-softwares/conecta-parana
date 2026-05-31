import '../../domain/entities/feed_item.dart';

class FeedItemModel {
  final String type;
  final Map<String, dynamic> data;

  const FeedItemModel({required this.type, required this.data});

  factory FeedItemModel.fromJson(Map<String, dynamic> json) {
    return FeedItemModel(
      type: json['type'] as String,
      data: json['data'] as Map<String, dynamic>,
    );
  }

  FeedItem toDomain() {
    final itemType = _parseType(type);
    return FeedItem(
      id: data['id'] as String,
      type: itemType,
      title: data['title'] as String,
      subtitle: data['description'] as String?,
      imageUrl: data['imageUrl'] as String?,
      category: data['category'] as String?,
      date: _parseDate(itemType),
      isPriority: data['priority'] as bool? ?? false,
    );
  }

  DateTime? _parseDate(FeedItemType type) {
    final raw = switch (type) {
      FeedItemType.event => data['eventDate'] as String?,
      FeedItemType.comunicado ||
      FeedItemType.news => data['updatedAt'] as String?,
    };
    return raw != null ? DateTime.tryParse(raw) : null;
  }

  static FeedItemType _parseType(String raw) {
    return switch (raw) {
      'event' => FeedItemType.event,
      'comunicado' => FeedItemType.comunicado,
      _ => FeedItemType.news,
    };
  }
}
