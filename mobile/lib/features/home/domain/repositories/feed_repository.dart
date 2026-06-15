import '../entities/feed_page.dart';

abstract class FeedRepository {
  Future<FeedPage> getFeed({
    required String cityId,
    double? lat,
    double? lng,
    String? cursor,
    int limit = 20,
  });
}

class FeedCityRequiredException implements Exception {
  const FeedCityRequiredException();
}

class FeedNetworkException implements Exception {
  const FeedNetworkException();
}

class FeedInvalidCursorException implements Exception {
  const FeedInvalidCursorException();
}
