// DEV ONLY
// Gera um JWT fake para testar o fluxo de autenticação
// Será removido quando a integração com backend estiver pronta.

import 'dart:convert';

String generateFakeJwt({bool expired = false}) {
  final header = {'alg': 'HS256', 'typ': 'JWT'};

  final payload = {
    'sub': '123',
    'role': 'CIDADAO',
    'cityId': 'cit_01KTMWGF7NERBQQ92JDMF1RFF9',
    'exp': expired
        ? DateTime.now()
                  .subtract(const Duration(hours: 1))
                  .millisecondsSinceEpoch ~/
              1000
        : DateTime.now().add(const Duration(hours: 1)).millisecondsSinceEpoch ~/
              1000,
  };

  String encode(Map<String, dynamic> json) {
    final str = jsonEncode(json);
    final bytes = utf8.encode(str);
    return base64UrlEncode(bytes).replaceAll('=', '');
  }

  final encodedHeader = encode(header);
  final encodedPayload = encode(payload);

  return '$encodedHeader.$encodedPayload.signatureFake';
}
