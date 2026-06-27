class Ticket {
  final String id;
  final String title;
  final String type;
  final String status;
  final DateTime createdAt;

  final DateTime updatedAt;

  const Ticket({
    required this.id,
    required this.title,
    required this.type,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.parse(json['createdAt'] as String);
    final updatedAtRaw = json['updatedAt'] as String?;

    return Ticket(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
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
}
