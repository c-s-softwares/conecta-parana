class AuthorSummary {
  final String id;
  final String name;

  const AuthorSummary({required this.id, required this.name});

  static AuthorSummary? fromJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    final id = json['id'] as String?;
    final name = json['name'] as String?;
    if (id == null || name == null) return null;
    return AuthorSummary(id: id, name: name);
  }
}
