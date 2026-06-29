import '../../domain/entities/feed_item.dart';
import '../../domain/entities/feed_page.dart';
import '../../domain/entities/home_highlights.dart';
import '../../../events/domain/entities/event_list_item.dart';
import 'package:conectaparana/core/media/media_photo.dart';
import 'package:conectaparana/core/media/media_url_resolver.dart';

class FeedResponseModel {
  final Map<String, dynamic>? mainNews;
  final List<Map<String, dynamic>> events;
  final List<Map<String, dynamic>> communicates;
  final List<Map<String, dynamic>> categories;

  const FeedResponseModel({
    required this.mainNews,
    required this.events,
    required this.communicates,
    required this.categories,
  });

  factory FeedResponseModel.fromJson(
    Map<String, dynamic> json, {
    List<Map<String, dynamic>> categories = const [],
  }) {
    return FeedResponseModel(
      mainNews: json['mainNews'] as Map<String, dynamic>?,
      events: _listOfMaps(json['events']),
      communicates: _listOfMaps(json['communicates']),
      categories: categories,
    );
  }

  FeedPage toDomain() {
    final items = <FeedItem>[...communicates.map(_communicateToItem)];

    return FeedPage(
      items: items,
      highlights: HomeHighlights(
        featuredBanner: mainNews != null ? _newsToBanner(mainNews!) : null,
        services: categories.map(_categoryToService).toList(),
        events: events.map(_eventToHighlight).toList(),
      ),
      hasMore: false,
    );
  }

  static List<Map<String, dynamic>> _listOfMaps(dynamic value) {
    final raw = value as List<dynamic>? ?? const [];
    return raw.whereType<Map<String, dynamic>>().toList();
  }

  static FeedItem _communicateToItem(Map<String, dynamic> data) {
    final createdAt =
        _parseDate(data['createdAt']) ?? _parseDate(data['updatedAt']);
    final author =
        data['authorName'] as String? ??
        data['sourceName'] as String? ??
        'Prefeitura Municipal';
    final timeLabel = _relativeTimeLabel(createdAt);

    final photos = MediaPhoto.listFromJson(data['photos']);
    return FeedItem(
      id: data['id'] as String,
      type: FeedItemType.comunicado,
      title: data['title'] as String? ?? '',
      subtitle: timeLabel.isEmpty ? author : '$author · $timeLabel',
      imageUrl:
          photos.firstOrNull?.displayUrl ??
          MediaUrlResolver.resolve(data['thumbUrl']) ??
          MediaUrlResolver.resolve(data['imageUrl']),
      photos: photos,
      category: data['category'] as String?,
      date: createdAt,
    );
  }

  static HomeFeaturedBanner _newsToBanner(Map<String, dynamic> data) {
    final id = data['id'] as String;
    final type = data['type'] as String?;
    final updatedAt =
        _parseDate(data['updatedAt']) ?? _parseDate(data['createdAt']);

    return HomeFeaturedBanner(
      id: id,
      tags: [if (type != null && type.isNotEmpty) type.toUpperCase()],
      highlightText: 'Noticia em destaque',
      title: data['title'] as String? ?? '',
      authorName: 'Prefeitura',
      timeLabel: _relativeTimeLabel(updatedAt),
      detailRoute: '/home/news/$id',
      photos: MediaPhoto.listFromJson(data['photos']),
    );
  }

  static EventListItem _eventToHighlight(Map<String, dynamic> data) {
    final id = data['id'] as String;
    final eventDate = _parseDate(data['eventDate']) ?? DateTime.now();

    return EventListItem(
      id: id,
      title: data['title'] as String? ?? '',
      category: data['type'] as String? ?? 'evento',
      date: eventDate,
      dateLabel: _dateLabel(eventDate),
      time:
          '${eventDate.hour.toString().padLeft(2, '0')}:${eventDate.minute.toString().padLeft(2, '0')}',
      location: _eventAddress(data),
      gradientColors: const ['0xFF0788B9', '0xFF00529B'],
      isFeatured: data['priority'] == true,
      likesCount: data['likesCount'] as int? ?? 0,
      liked:
          data['liked'] as bool? ??
          data['isLiked'] as bool? ??
          data['likedByMe'] as bool? ??
          false,
      saved:
          data['saved'] as bool? ??
          data['isSaved'] as bool? ??
          data['savedByMe'] as bool? ??
          false,
      photos: MediaPhoto.listFromJson(data['photos']),
      detailRoute: '/events/$id',
    );
  }

  static HomeService _categoryToService(Map<String, dynamic> data) {
    return HomeService(
      id: data['id'] as String,
      label: data['name'] as String? ?? '',
      icon: data['icon'] as String? ?? '',
      route: '/map',
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value is! String || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }

  static String _eventAddress(Map<String, dynamic> data) {
    final value = data['address'];
    if (value is! String || value.trim().isEmpty) return 'Local a definir';
    return value.trim();
  }

  static String _dateLabel(DateTime? date) {
    if (date == null) return '';
    const months = [
      'JAN',
      'FEV',
      'MAR',
      'ABR',
      'MAI',
      'JUN',
      'JUL',
      'AGO',
      'SET',
      'OUT',
      'NOV',
      'DEZ',
    ];
    return '${date.day.toString().padLeft(2, '0')} ${months[date.month - 1]}';
  }

  static String _relativeTimeLabel(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date.toLocal());
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inHours < 1) return '${diff.inMinutes}min';
    if (diff.inDays < 1) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}
