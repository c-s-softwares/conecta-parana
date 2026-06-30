import 'package:flutter/foundation.dart';
import 'deep_link_route.dart';

class DeepLinkParser {
  static const _host = 'conectaparana.app';
  static const _sharePrefix = '/share/';

  static DeepLinkRoute? parse(Uri uri) {
    if (uri.scheme == 'conectaparana') {
      return _parseSegments(uri.pathSegments);
    }

    if (uri.scheme != 'https') return null;

    final isLocalHost =
        uri.host == 'localhost' ||
        uri.host == '127.0.0.1' ||
        uri.host == '10.0.2.2';
    if (uri.host != _host && !(kDebugMode && isLocalHost)) return null;

    final path = uri.path;
    if (!path.startsWith(_sharePrefix)) return null;

    final rest = path.substring(_sharePrefix.length);
    final segments = rest.split('/').where((s) => s.isNotEmpty).toList();

    return _parseSegments(segments);
  }

  static DeepLinkRoute? _parseSegments(List<String> segments) {
    if (segments.length < 2) return null;

    final typeSegment = segments[0];
    final id = segments[1];

    if (id.isEmpty) return null;

    final type = DeepLinkType.tryParse(typeSegment);
    if (type == null) {
      if (kDebugMode) {
        debugPrint('[DeepLink] Tipo desconhecido: "$typeSegment"');
      }
      return null;
    }

    return DeepLinkRoute(type: type, id: id);
  }
}
