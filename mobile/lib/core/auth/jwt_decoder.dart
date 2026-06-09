import 'dart:convert';

class JwtPayload {
  final String sub;
  final String role;
  final String cityId;

  JwtPayload({
    required this.sub,
    required this.role,
    required this.cityId,
  });
}

class JwtDecoder {
  static JwtPayload decode(String token) {
    final parts = token.split('.');

    if (parts.length != 3) throw Exception('JWT inválido!');

    final payload = parts[1];
    final normalized = base64Url.normalize(payload);
    final decoded = utf8.decode(base64Url.decode(normalized));

    final Map<String, dynamic> jsonMap = json.decode(decoded);

    return JwtPayload(
      sub: jsonMap['sub'].toString(),
      role: jsonMap['role'].toString(),
      cityId: jsonMap['cityId']?.toString() ?? '',
    );
  }
}