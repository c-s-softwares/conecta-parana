class City {
  final String id;
  final String name;
  final String state;

  const City({required this.id, required this.name, required this.state});

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      id: json['id'] as String,
      name: json['name'] as String,
      state: (json['estado'] ?? json['state'] ?? 'PR') as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'state': state,
  };
}