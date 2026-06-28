import 'feed_item.dart';
import 'home_highlights.dart';

class FeedPage {
  final List<FeedItem> items;
  final HomeHighlights highlights;
  final String? nextCursor;
  final bool hasMore;

  const FeedPage({
    required this.items,
    this.highlights = const HomeHighlights(),
    this.nextCursor,
    required this.hasMore,
  });
}
