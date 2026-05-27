enum DeepLinkType {
  event,
  comunicado,
  news,
  local,
  ticket,
  notification;

  static DeepLinkType? tryParse(String segment) {
    for (final type in values) {
      if (type.name == segment) return type;
    }
    return null;
  }
}

class DeepLinkRoute {
  final DeepLinkType type;
  final String id;

  const DeepLinkRoute({required this.type, required this.id});

  String get path => '/${type.name}/$id';

  @override
  String toString() => 'DeepLinkRoute(type: ${type.name}, id: $id)';
}
