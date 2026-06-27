import 'package:conectaparana/features/communicates/presentation/pages/communicate_detail_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('deve renderizar detalhe do comunicado', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: CommunicateDetailPage(
          communicateId: 'cmt_1',
          showMockPhotos: false,
        ),
      ),
    );

    expect(
      find.text('Coleta de lixo será reorganizada por bairro a partir de segunda'),
      findsWidgets,
    );

    expect(find.text('Prefeitura de Curitiba'), findsOneWidget);
    expect(find.text('Ativar alerta desta secretaria'), findsOneWidget);
    expect(find.text('O QUE MUDA'), findsOneWidget);
  });
}