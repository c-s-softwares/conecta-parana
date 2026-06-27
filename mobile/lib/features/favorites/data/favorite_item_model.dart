enum FavoriteItemType {
  event,
  communicate,
  news,
  local;

  String get label {
    switch (this) {
      case FavoriteItemType.event:
        return 'Eventos';
      case FavoriteItemType.communicate:
        return 'Comunicados';
      case FavoriteItemType.news:
        return 'Notícias';
      case FavoriteItemType.local:
        return 'Locais';
    }
  }

  String get routeBase {
    switch (this) {
      case FavoriteItemType.event:
        return '/home/event';
      case FavoriteItemType.communicate:
        return '/home/communicate';
      case FavoriteItemType.news:
        return '/home/news';
      case FavoriteItemType.local:
        return '/home/local';
    }
  }
}

class FavoriteItemModel {
  const FavoriteItemModel({
    required this.id,
    required this.title,
    required this.type,
    required this.isAvailable,
    this.description,
    this.imageUrl,
  });

  final String id;
  final String title;
  final FavoriteItemType type;
  final bool isAvailable;
  final String? description;
  final String? imageUrl;

  factory FavoriteItemModel.fromJson(
    Map<String, dynamic> json, {
    FavoriteItemType? fallbackType,
  }) {
    final content = _extractContent(json);

    return FavoriteItemModel(
      id:
          _pickString(content, ['id', 'entityId']) ??
          _pickString(json, ['id', 'entityId']) ??
          '',
      title:
          _pickString(content, ['title', 'name']) ??
          _pickString(json, ['title', 'name']) ??
          'Sem título',
      description: _pickString(content, ['description', 'summary']),
      imageUrl: _pickString(content, ['imageUrl', 'photoUrl', 'coverUrl']),
      type:
          fallbackType ??
          _typeFromJson(_pickString(json, ['type', 'entityType'])),
      isAvailable: _isAvailable(content),
    );
  }

  static Map<String, dynamic> _extractContent(Map<String, dynamic> json) {
    for (final key in [
      'event',
      'communicate',
      'news',
      'local',
      'entity',
      'item',
    ]) {
      final value = json[key];
      if (value is Map<String, dynamic>) {
        return value;
      }
    }

    return json;
  }

  static String? _pickString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value != null && value.toString().isNotEmpty) {
        return value.toString();
      }
    }

    return null;
  }

  static bool _isAvailable(Map<String, dynamic> json) {
    if (json['removed'] == true || json['deletedAt'] != null) {
      return false;
    }

    if (json.containsKey('isActive')) {
      return json['isActive'] == true;
    }

    if (json.containsKey('active')) {
      return json['active'] == true;
    }

    if (json.containsKey('isAvailable')) {
      return json['isAvailable'] == true;
    }

    return true;
  }

  static FavoriteItemType _typeFromJson(String? value) {
    switch (value?.toLowerCase()) {
      case 'event':
      case 'events':
        return FavoriteItemType.event;
      case 'communicate':
      case 'communicates':
        return FavoriteItemType.communicate;
      case 'news':
        return FavoriteItemType.news;
      case 'local':
      case 'locals':
        return FavoriteItemType.local;
      default:
        return FavoriteItemType.news;
    }
  }
}
