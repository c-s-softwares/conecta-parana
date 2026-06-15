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

class HomeHighlightEvent {
  final String id;
  final String title;
  final String dateLabel;
  final String location;
  final List<String> gradientColors;
  final String? badgeLabel;
  final String detailRoute;

  const HomeHighlightEvent({
    required this.id,
    required this.title,
    required this.dateLabel,
    required this.location,
    required this.gradientColors,
    this.badgeLabel,
    required this.detailRoute,
  });
}

class HomeHighlights {
  final HomeAlert? alert;
  final HomeFeaturedBanner? featuredBanner;
  final List<HomeService> services;
  final List<HomeHighlightEvent> events;

  const HomeHighlights({
    this.alert,
    this.featuredBanner,
    this.services = const [],
    this.events = const [],
  });
}
