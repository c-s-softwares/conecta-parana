import 'package:conectaparana/core/router/deep_link_parser.dart';
import 'package:conectaparana/core/router/deep_link_route.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DeepLinkParser', () {
    group('HTTPS scheme — tipos válidos', () {
      const validCases = [
        ('event', 'evt_123', '/event/evt_123'),
        ('comunicado', 'com_456', '/comunicado/com_456'),
        ('news', 'news_789', '/news/news_789'),
        ('local', 'loc_abc', '/local/loc_abc'),
        ('ticket', 'tkt_def', '/ticket/tkt_def'),
        ('notification', 'ntf_ghi', '/notification/ntf_ghi'),
      ];

      for (final (type, id, expectedPath) in validCases) {
        test('parseia /$type/$id corretamente', () {
          final uri = Uri.parse('https://conectaparana.app/share/$type/$id');
          final result = DeepLinkParser.parse(uri);

          expect(result, isNotNull);
          expect(result!.path, equals(expectedPath));
          expect(result.id, equals(id));
        });
      }
    });

    test('parseia custom scheme conectaparana://', () {
      final uri = Uri.parse('conectaparana://share/event/evt_123');
      final result = DeepLinkParser.parse(uri);

      expect(result, isNotNull);
      expect(result!.type, equals(DeepLinkType.event));
      expect(result.id, equals('evt_123'));
    });

    test('retorna null para tipo desconhecido', () {
      final uri = Uri.parse('https://conectaparana.app/share/unknown/abc123');
      final result = DeepLinkParser.parse(uri);

      expect(result, isNull);
    });

    for (final host in ['localhost', '127.0.0.1', '10.0.2.2']) {
      test('retorna null para host $host (localhost dev)', () {
        final uri = Uri.parse('https://$host/share/event/evt_123');
        final result = DeepLinkParser.parse(uri);

        expect(result, isNull);
      });
    }

    test('retorna null para domínio diferente', () {
      final uri = Uri.parse('https://outro-dominio.com/share/event/evt_123');
      expect(DeepLinkParser.parse(uri), isNull);
    });

    test('retorna null quando path não começa com /share/', () {
      final uri = Uri.parse('https://conectaparana.app/event/evt_123');
      expect(DeepLinkParser.parse(uri), isNull);
    });

    test('retorna null quando id está ausente', () {
      final uri = Uri.parse('https://conectaparana.app/share/event/');
      expect(DeepLinkParser.parse(uri), isNull);
    });

    test('retorna null para scheme HTTP', () {
      final uri = Uri.parse('http://conectaparana.app/share/event/evt_123');
      expect(DeepLinkParser.parse(uri), isNull);
    });
  });

  group('DeepLinkRoute.path', () {
    test('gera path correto para event', () {
      const route = DeepLinkRoute(type: DeepLinkType.event, id: 'evt_abc');
      expect(route.path, equals('/event/evt_abc'));
    });

    test('gera path correto para notification', () {
      const route = DeepLinkRoute(
        type: DeepLinkType.notification,
        id: 'ntf_xyz',
      );
      expect(route.path, equals('/notification/ntf_xyz'));
    });
  });

  group('DeepLinkType.tryParse', () {
    test('retorna o tipo correto para nome válido', () {
      expect(DeepLinkType.tryParse('event'), equals(DeepLinkType.event));
      expect(DeepLinkType.tryParse('ticket'), equals(DeepLinkType.ticket));
    });

    test('retorna null para nome inválido', () {
      expect(DeepLinkType.tryParse('foobar'), isNull);
      expect(DeepLinkType.tryParse(''), isNull);
    });
  });
}
