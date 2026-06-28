class City {
  static final RegExp _backendIdPattern = RegExp(
    r'^cit_[0-9A-HJKMNP-TV-Z]{26}$',
    caseSensitive: false,
  );

  final String id;
  final String name;

  const City({required this.id, required this.name});

  static bool isValidBackendId(String value) {
    return _backendIdPattern.hasMatch(value.trim());
  }

  bool get hasValidBackendId => isValidBackendId(id);

  factory City.fromJson(Map<String, dynamic> json) {
    return City(id: json['id'] as String, name: json['name'] as String);
  }

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}
