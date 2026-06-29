import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/media/media_photo.dart';

class TicketCoordinates {
  final double lat;
  final double lng;

  const TicketCoordinates({required this.lat, required this.lng});

  factory TicketCoordinates.fromJson(Map<String, dynamic> json) {
    return TicketCoordinates(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }
}

class TicketPhoto extends MediaPhoto {
  final String id;

  const TicketPhoto({required this.id, super.url, super.thumbUrl});

  factory TicketPhoto.fromJson(Map<String, dynamic> json) {
    final photo = MediaPhoto.fromJson(json);
    return TicketPhoto(
      id: json['id']?.toString() ?? '',
      url: photo.url,
      thumbUrl: photo.thumbUrl,
    );
  }

  factory TicketPhoto.fromId(String id) => TicketPhoto(id: id);
}

enum TicketCommentAuthor { citizen, admin }

class TicketComment {
  final String id;
  final String ticketId;
  final String authorId;
  final String? authorName;
  final TicketCommentAuthor author;
  final String message;
  final DateTime createdAt;
  final bool isOptimistic;
  final List<TicketPhoto> photos;

  const TicketComment({
    required this.id,
    required this.ticketId,
    required this.authorId,
    required this.author,
    required this.message,
    required this.createdAt,
    this.authorName,
    this.isOptimistic = false,
    this.photos = const [],
  });

  factory TicketComment.fromJson(
    Map<String, dynamic> json, {
    String? ticketOwnerId,
  }) {
    final authorId = json['authorId'] as String;
    final role = (json['authorRole'] ?? json['authorType'] ?? json['role'])
        ?.toString()
        .toLowerCase();
    final isAdmin = json['isAdmin'] == true || role == 'admin';

    return TicketComment(
      id: json['id'] as String,
      ticketId: json['ticketId'] as String,
      authorId: authorId,
      authorName: json['authorName'] as String?,
      author: isAdmin || (ticketOwnerId != null && authorId != ticketOwnerId)
          ? TicketCommentAuthor.admin
          : TicketCommentAuthor.citizen,
      message: json['message'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      photos: _parseTicketPhotos(json['photos']),
    );
  }

  TicketComment copyWith({bool? isOptimistic}) {
    return TicketComment(
      id: id,
      ticketId: ticketId,
      authorId: authorId,
      authorName: authorName,
      author: author,
      message: message,
      createdAt: createdAt,
      isOptimistic: isOptimistic ?? this.isOptimistic,
      photos: photos,
    );
  }
}

class TicketDetail {
  final String id;
  final String type;
  final String title;
  final String description;
  final String status;
  final TicketCoordinates? coordinates;
  final String? address;
  final String cityId;
  final String userId;
  final String? assignedToId;
  final String? assignedToName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? resolvedAt;
  final List<TicketPhoto> photos;
  final List<TicketComment> comments;

  const TicketDetail({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.status,
    this.coordinates,
    this.address,
    required this.cityId,
    required this.userId,
    this.assignedToId,
    this.assignedToName,
    required this.createdAt,
    required this.updatedAt,
    this.resolvedAt,
    required this.photos,
    required this.comments,
  });

  factory TicketDetail.fromJson(Map<String, dynamic> json) {
    final userId = json['userId'] as String;
    return TicketDetail(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      status: json['status'] as String,
      coordinates: json['coordinates'] != null
          ? TicketCoordinates.fromJson(
              json['coordinates'] as Map<String, dynamic>,
            )
          : null,
      address: json['address'] as String?,
      cityId: json['cityId'] as String,
      userId: userId,
      assignedToId: json['assignedToId'] as String?,
      assignedToName: json['assignedToName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'] as String)
          : null,
      photos: _parsePhotos(json),
      comments: (json['comments'] as List<dynamic>? ?? const [])
          .map(
            (comment) => TicketComment.fromJson(
              comment as Map<String, dynamic>,
              ticketOwnerId: userId,
            ),
          )
          .toList(),
    );
  }

  static List<TicketPhoto> _parsePhotos(Map<String, dynamic> json) {
    final photos = json['photos'];
    if (photos is List) {
      final parsed = _parseTicketPhotos(photos);
      if (parsed.isNotEmpty) return parsed;
    }

    final photoIds = json['photoIds'];
    if (photoIds is List) {
      return photoIds.map((id) => TicketPhoto.fromId(id.toString())).toList();
    }

    return const [];
  }

  String get displayNumber {
    final digits = id.replaceAll(RegExp(r'[^0-9]'), '');
    final tail = digits.length > 3
        ? digits.substring(digits.length - 3)
        : digits.padLeft(3, '0');
    return '#$tail';
  }

  bool get isClosed => status == 'fechado';

  TicketDetail copyWith({List<TicketComment>? comments}) {
    return TicketDetail(
      id: id,
      type: type,
      title: title,
      description: description,
      status: status,
      coordinates: coordinates,
      address: address,
      cityId: cityId,
      userId: userId,
      assignedToId: assignedToId,
      assignedToName: assignedToName,
      createdAt: createdAt,
      updatedAt: updatedAt,
      resolvedAt: resolvedAt,
      photos: photos,
      comments: comments ?? this.comments,
    );
  }

  TicketComment optimisticComment(String message) {
    final user = AuthService.instance.currentUser.value;
    final now = DateTime.now();
    return TicketComment(
      id: 'local_${now.microsecondsSinceEpoch}',
      ticketId: id,
      authorId: user?.id ?? userId,
      authorName: 'Você',
      author: TicketCommentAuthor.citizen,
      message: message,
      createdAt: now,
      isOptimistic: true,
    );
  }
}

List<TicketPhoto> _parseTicketPhotos(dynamic value) {
  if (value is! List) return const [];
  return value
      .whereType<Map<String, dynamic>>()
      .map(TicketPhoto.fromJson)
      .where((photo) => photo.hasImage)
      .toList(growable: false);
}
