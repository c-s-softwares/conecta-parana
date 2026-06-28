import '../../../events/domain/entities/event_list_item.dart';

class HomeAlert {
  final String title;
  final String description;
  final String timeLabel;

  const HomeAlert({
    required this.title,
    required this.description,
    required this.timeLabel,
  });
}

class HomeFeaturedBanner {
  final String id;
  final List<String> tags;
  final String highlightText;
  final String title;
  final String authorName;
  final String timeLabel;
  final String detailRoute;

  const HomeFeaturedBanner({
    required this.id,
    required this.tags,
    required this.highlightText,
    required this.title,
    required this.authorName,
    required this.timeLabel,
    required this.detailRoute,
  });
}

class HomeService {
  final String id;
  final String label;
  final String icon;
  final String route;

  const HomeService({
    required this.id,
    required this.label,
    required this.icon,
    required this.route,
  });
}

class HomeHighlights {
  final HomeAlert? alert;
  final HomeFeaturedBanner? featuredBanner;
  final List<HomeService> services;
  final List<EventListItem> events;

  const HomeHighlights({
    this.alert,
    this.featuredBanner,
    this.services = const [],
    this.events = const [],
  });
}
