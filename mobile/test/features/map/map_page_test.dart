import 'package:conectaparana/features/map/presentation/pages/map_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('exibe aviso de mapa indisponivel', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: MapPage()));

    expect(find.byKey(const Key('map_unavailable_banner')), findsOneWidget);
    expect(
      find.text('A função de mapa estará disponível em breve!'),
      findsOneWidget,
    );
  });
}
