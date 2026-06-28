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
        return '/events';
      case FavoriteItemType.communicate:
        return '/home/comunicado';
      case FavoriteItemType.news:
        return '/home/news';
      case FavoriteItemType.local:
        return '/map';
    }
  }

  String get singularLabel => switch (this) {
    FavoriteItemType.event => 'Evento',
    FavoriteItemType.communicate => 'Comunicado',
    FavoriteItemType.news => 'Notícia',
    FavoriteItemType.local => 'Local',
  };

  String get requestKey => switch (this) {
    FavoriteItemType.event => 'eventId',
    FavoriteItemType.communicate => 'communicateId',
    FavoriteItemType.news => 'newsId',
    FavoriteItemType.local => 'localId',
  };
}

class FavoriteItemModel {
  const FavoriteItemModel({
    required this.id,
    required this.title,
    required this.type,
    required this.isAvailable,
    this.description,
    this.imageUrl,
    this.category,
    this.date,
  });

  final String id;
  final String title;
  final FavoriteItemType type;
  final bool isAvailable;
  final String? description;
  final String? imageUrl;
  final String? category;
  final DateTime? date;

  String get tagLabel {
    final base = type.singularLabel.toUpperCase();
    final normalizedCategory = category
        ?.trim()
        .replaceAll('_', ' ')
        .toUpperCase();
    if (normalizedCategory == null ||
        normalizedCategory.isEmpty ||
        normalizedCategory == base) {
      return base;
    }
    return '$base • $normalizedCategory';
  }

  String get metadataLabel {
    final value = date;
    if (value == null) return 'Salvo';
    if (type == FavoriteItemType.event) return _dayMonth(value);

    final difference = DateTime.now().difference(value.toLocal());
    if (difference.isNegative) return _dayMonth(value);
    if (difference.inMinutes < 1) return 'agora';
    if (difference.inHours < 1) return '${difference.inMinutes}min';
    if (difference.inDays < 1) return '${difference.inHours}h';
    if (difference.inDays < 7) return '${difference.inDays}d';
    return _dayMonth(value);
  }

  factory FavoriteItemModel.fromJson(
    Map<String, dynamic> json, {
    FavoriteItemType? fallbackType,
  }) {
    final content = _extractContent(json);
    final type =
        fallbackType ??
        _typeFromJson(_pickString(json, ['type', 'entityType']));
    final savedAt = _pickDate(json, ['savedAt', 'createdAt']);
    final contentDate = type == FavoriteItemType.event
        ? _pickDate(content, ['eventDate'])
        : _pickDate(content, ['publishedAt', 'createdAt', 'updatedAt']);

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
      category: _pickString(content, ['categoryName', 'category', 'type']),
      date: contentDate ?? savedAt,
      type: type,
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

  static DateTime? _pickDate(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value is DateTime) return value;
      if (value is String) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
    }
    return null;
  }

  static String _dayMonth(DateTime value) {
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    return '${value.day} ${months[value.month - 1]}';
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
