enum FeedItemType { event, comunicado, news }

class FeedItem {
  final String id;
  final FeedItemType type;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? category;
  final DateTime? date;
  final bool isPriority;

  const FeedItem({
    required this.id,
    required this.type,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.category,
    this.date,
    this.isPriority = false,
  });

  String get detailRoute {
    switch (type) {
      case FeedItemType.event:
        return '/events/$id';
      case FeedItemType.comunicado:
        return '/home/comunicado/$id';
      case FeedItemType.news:
        return '/home/news/$id';
    }
  }
}
