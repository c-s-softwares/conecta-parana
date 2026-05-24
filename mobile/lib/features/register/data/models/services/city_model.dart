class City {
  final String id;
  final String name;

  const City({required this.id, required this.name});

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      id:   json['id']   as String,
      name: json['name'] as String,
    );
  }
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
  };

}