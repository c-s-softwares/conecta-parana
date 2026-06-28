class EventListItem {
  final String id;
  final String title;
  final String category;
  final DateTime date;
  final String? dateLabel;
  final String time;
  final String location;
  final bool isFree;
  final bool isFeatured;
  final int likesCount;
  final bool liked;
  final bool saved;
  final List<String> gradientColors;
  final String detailRoute;

  const EventListItem({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    this.dateLabel,
    required this.time,
    required this.location,
    this.isFree = false,
    this.isFeatured = false,
    this.likesCount = 0,
    this.liked = false,
    this.saved = false,
    this.gradientColors = const ['0xFF006733', '0xFF004D26'],
    required this.detailRoute,
  });
}
