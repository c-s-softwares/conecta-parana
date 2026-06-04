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

  String get path {
    switch (type) {
      case DeepLinkType.event:
        return '/events/$id';
      case DeepLinkType.comunicado:
        return '/home/comunicado/$id';
      case DeepLinkType.news:
        return '/home/news/$id';
      case DeepLinkType.local:
        return '/map/$id';
      case DeepLinkType.ticket:
        return '/tickets/$id';
      case DeepLinkType.notification:
        return '/home/notification/$id';
    }
  }

  @override
  String toString() => 'DeepLinkRoute(type: ${type.name}, id: $id)';
}
