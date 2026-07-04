import 'package:conectaparana/core/formatters/app_date_formatter.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('formata publicacao do mesmo dia como Hoje', () {
    final now = DateTime(2026, 6, 29, 15);

    expect(
      AppDateFormatter.publication(DateTime(2026, 6, 29, 10), now: now),
      'Hoje, 10:00',
    );
  });

  test('formata publicacao completa em portugues', () {
    expect(
      AppDateFormatter.publication(
        DateTime(2026, 6, 29, 10),
        now: DateTime(2026, 6, 30),
      ),
      '29 de Junho de 2026 às 10:00',
    );
  });

  test('formata data curta de evento ou ticket', () {
    expect(
      AppDateFormatter.shortDateTime(DateTime(2026, 6, 29, 10)),
      '29/06/2026 - 10h00',
    );
  });
}
