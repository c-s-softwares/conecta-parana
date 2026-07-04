import 'package:conectaparana/core/media/media_photo.dart';
import 'package:conectaparana/shared/models/author_summary.dart';

class EventPhoto extends MediaPhoto {
  const EventPhoto({required String id, super.url, super.thumbUrl})
    : super(id: id);

  factory EventPhoto.fromJson(Map<String, dynamic> json) {
    final photo = MediaPhoto.fromJson(json);
    return EventPhoto(
      id: json['id']?.toString() ?? '',
      url: photo.url,
      thumbUrl: photo.thumbUrl,
    );
  }
}

class EventLocal {
  final String id;
  final String name;

  const EventLocal({required this.id, required this.name});

  factory EventLocal.fromJson(Map<String, dynamic> json) {
    return EventLocal(id: json['id'] as String, name: json['name'] as String);
  }
}

class EventCoordinates {
  final double lat;
  final double lng;

  const EventCoordinates({required this.lat, required this.lng});

  factory EventCoordinates.fromJson(Map<String, dynamic> json) {
    return EventCoordinates(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }
}

class EventDetail {
  final String id;
  final String title;
  final String description;
  final String type;
  final String status;
  final DateTime eventDate;
  final DateTime? eventEndDate;
  final String? entranceInfo;
  final String cityId;
  final EventCoordinates? coordinates;
  final EventLocal? local;
  final AuthorSummary? author;
  final List<EventPhoto> photos;
  final int likesCount;
  final bool likedByMe;
  final bool savedByMe;

  const EventDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.status,
    required this.eventDate,
    this.eventEndDate,
    this.entranceInfo,
    required this.cityId,
    this.coordinates,
    this.local,
    this.author,
    required this.photos,
    required this.likesCount,
    required this.likedByMe,
    required this.savedByMe,
  });

  factory EventDetail.fromJson(Map<String, dynamic> json) {
    return EventDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      type: json['type'] as String,
      status:
          json['status'] as String? ??
          ((json['isActive'] as bool? ?? true) ? 'publicado' : 'cancelado'),
      eventDate: DateTime.parse(json['eventDate'] as String),
      eventEndDate: json['eventEndDate'] != null
          ? DateTime.parse(json['eventEndDate'] as String)
          : null,
      entranceInfo: json['entranceInfo'] as String?,
      cityId: json['cityId'] as String,
      coordinates: json['coordinates'] != null
          ? EventCoordinates.fromJson(
              json['coordinates'] as Map<String, dynamic>,
            )
          : null,
      local: json['local'] != null
          ? EventLocal.fromJson(json['local'] as Map<String, dynamic>)
          : null,
      author: AuthorSummary.fromJson(json['user'] as Map<String, dynamic>?),
      photos: (json['photos'] as List<dynamic>? ?? const [])
          .map((p) => EventPhoto.fromJson(p as Map<String, dynamic>))
          .where((photo) => photo.hasImage)
          .toList(),
      likesCount: json['likesCount'] as int? ?? 0,
      likedByMe:
          json['liked'] as bool? ??
          json['isLiked'] as bool? ??
          json['likedByMe'] as bool? ??
          false,
      savedByMe:
          json['saved'] as bool? ??
          json['isSaved'] as bool? ??
          json['savedByMe'] as bool? ??
          false,
    );
  }

  EventDetail copyWith({int? likesCount, bool? likedByMe, bool? savedByMe}) {
    return EventDetail(
      id: id,
      title: title,
      description: description,
      type: type,
      status: status,
      eventDate: eventDate,
      eventEndDate: eventEndDate,
      entranceInfo: entranceInfo,
      cityId: cityId,
      coordinates: coordinates,
      local: local,
      author: author,
      photos: photos,
      likesCount: likesCount ?? this.likesCount,
      likedByMe: likedByMe ?? this.likedByMe,
      savedByMe: savedByMe ?? this.savedByMe,
    );
  }
}
