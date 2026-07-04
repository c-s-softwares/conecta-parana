import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';

class Ticket {
  final String id;
  final String title;
  final String description;
  final String type;
  final String status;
  final String? address;
  final TicketCoordinates? coordinates;
  final String cityId;
  final String userId;
  final String? assignedToId;
  final DateTime? resolvedAt;
  final List<String> photoIds;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Ticket({
    required this.id,
    required this.title,
    this.description = '',
    required this.type,
    required this.status,
    this.address,
    this.coordinates,
    this.cityId = '',
    this.userId = '',
    this.assignedToId,
    this.resolvedAt,
    this.photoIds = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.parse(json['createdAt'] as String);
    final updatedAtRaw = json['updatedAt'] as String?;
    final coordinates = json['coordinates'];

    return Ticket(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      type: json['type'] as String,
      status: json['status'] as String,
      address: json['address'] as String?,
      coordinates: coordinates is Map<String, dynamic>
          ? TicketCoordinates.fromJson(coordinates)
          : null,
      cityId: json['cityId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      assignedToId: json['assignedToId'] as String?,
      resolvedAt: _parseDateOrNull(json['resolvedAt']),
      photoIds: (json['photoIds'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
      createdAt: createdAt,
      updatedAt: updatedAtRaw != null
          ? DateTime.parse(updatedAtRaw)
          : createdAt,
    );
  }

  String get displayNumber {
    final digits = id.replaceAll(RegExp(r'[^0-9]'), '');
    final tail = digits.length > 3
        ? digits.substring(digits.length - 3)
        : digits.padLeft(3, '0');
    return '#$tail';
  }

  static DateTime? _parseDateOrNull(Object? value) {
    if (value is String && value.isNotEmpty) return DateTime.parse(value);
    return null;
  }
}
