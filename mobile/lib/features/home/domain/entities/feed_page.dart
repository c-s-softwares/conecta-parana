import 'feed_item.dart';

class FeedPage {
  final List<FeedItem> items;
  final String? nextCursor;
  final bool hasMore;

  const FeedPage({
    required this.items,
    this.nextCursor,
    required this.hasMore,
  });
}
