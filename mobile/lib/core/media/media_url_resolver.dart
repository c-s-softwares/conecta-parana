import 'package:flutter/foundation.dart';

class MediaUrlResolver {
  MediaUrlResolver._();

  static const _configuredApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
  static const _homologationBaseUrl = 'https://api.dev.conectaparana.pr.gov.br';

  static String? resolve(dynamic value) {
    if (value is! String || value.trim().isEmpty) return null;

    final raw = value.trim();
    final uri = Uri.tryParse(raw);
    if (uri == null || !uri.hasScheme) return raw;
    if (!_isLoopback(uri.host)) return raw;

    final replacement = Uri.tryParse(
      kReleaseMode ? _homologationBaseUrl : _configuredApiBaseUrl,
    );
    if (replacement == null || !replacement.hasAuthority) return raw;

    return Uri(
      scheme: replacement.scheme,
      userInfo: replacement.userInfo,
      host: replacement.host,
      port: replacement.hasPort ? replacement.port : null,
      path: uri.path,
      query: uri.hasQuery ? uri.query : null,
      fragment: uri.hasFragment ? uri.fragment : null,
    ).toString();
  }

  static bool _isLoopback(String host) {
    return host == 'localhost' || host == '127.0.0.1' || host == '::1';
  }
}
