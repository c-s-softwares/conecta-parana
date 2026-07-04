class City {
  static final RegExp _backendIdPattern = RegExp(
    r'^cit_[0-9A-HJKMNP-TV-Z]{26}$',
  );

  final String id;
  final String name;
  final String state;

  const City({required this.id, required this.name, this.state = 'PR'});

  static bool isValidBackendId(String value) =>
      _backendIdPattern.hasMatch(value.trim());

  bool get hasValidBackendId => isValidBackendId(id);

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      id: json['id'] as String,
      name: json['name'] as String,
      state: (json['estado'] ?? json['state'] ?? 'PR') as String,
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'state': state};
}
