// Este é um teste básico de widget Flutter.
//
// Para interagir com um widget em seu teste, use o utilitário WidgetTester
// do pacote flutter_test. Por exemplo, você pode enviar gestos de toque e
// rolagem. Você também pode usar WidgetTester para encontrar widgets filhos
// na árvore de widgets, ler texto e verificar que os valores das propriedades
// do widget estão corretos.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/shared/widgets/buttons/app_button.dart';
import 'package:conectaparana/shared/widgets/inputs/app_input.dart';
import 'package:conectaparana/shared/widgets/cards/app_card.dart';
import 'package:conectaparana/shared/widgets/feedback/app_bottom_sheet.dart';

void main() {
  group('AppButton', () {

    testWidgets('mostra o texto correto no botão', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              label: 'Entrar',
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.text('Entrar'), findsOneWidget);
    });

    testWidgets('chama a função quando clicado', (tester) async {
      bool foiClicado = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              label: 'Entrar',
              onPressed: () {
                foiClicado = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Entrar'));

      expect(foiClicado, true);
    });

    testWidgets('mostra spinner quando isLoading é true', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppButton(
              label: 'Entrar',
              isLoading: true,
            ),
          ),
        ),
      );

      expect(find.text('Entrar'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('não chama a função quando isLoading é true', (tester) async {
      bool foiClicado = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              label: 'Entrar',
              isLoading: true,
              onPressed: () {
                foiClicado = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));

      expect(foiClicado, false);
    });

  });

  group('AppInput', () {

    testWidgets('mostra o label corretamente', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppInput(label: 'E-MAIL'),
          ),
        ),
      );

      expect(find.text('E-MAIL'), findsOneWidget);
    });

    testWidgets('mostra mensagem de erro quando errorText é passado', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppInput(
              label: 'E-MAIL',
              errorText: 'E-mail inválido',
            ),
          ),
        ),
      );

      expect(find.text('E-mail inválido'), findsOneWidget);
    });

    testWidgets('mostra botão Mostrar quando tipo é password', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: AppInput(
              label: 'SENHA',
              type: AppInputType.password,
            ),
          ),
        ),
      );

      expect(find.text('Mostrar'), findsOneWidget);
    });

  });

  group('AppCard', () {

    testWidgets('mostra o título do card de evento', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppCard(
              variant: AppCardVariant.event,
              title: 'Aniversário de Maringá',
            ),
          ),
        ),
      );

      expect(find.text('Aniversário de Maringá'), findsOneWidget);
    });

    testWidgets('mostra o título do card de comunicado', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppCard(
              variant: AppCardVariant.announcement,
              title: 'Audiência pública',
            ),
          ),
        ),
      );

      expect(find.text('Audiência pública'), findsOneWidget);
    });

    testWidgets('mostra o título do card de notícia', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppCard(
              variant: AppCardVariant.news,
              title: 'Mutirão de limpeza',
            ),
          ),
        ),
      );

      expect(find.text('Mutirão de limpeza'), findsOneWidget);
    });

    testWidgets('mostra o título do card de local', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppCard(
              variant: AppCardVariant.local,
              title: 'UBS Zona 7',
            ),
          ),
        ),
      );

      expect(find.text('UBS Zona 7'), findsOneWidget);
    });

    testWidgets('chama onTap quando clicado', (tester) async {
      bool foiClicado = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppCard(
              variant: AppCardVariant.event,
              title: 'Aniversário de Maringá',
              onTap: () {
                foiClicado = true;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Aniversário de Maringá'));
      expect(foiClicado, true);
    });

  });

  group('AppBottomSheet', () {

    testWidgets('abre o bottom sheet com título correto', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    AppBottomSheet.show(
                      context,
                      title: 'Opções',
                      children: [
                        const Text('Compartilhar'),
                      ],
                    );
                  },
                  child: const Text('Abrir'),
                );
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Abrir'));

      await tester.pumpAndSettle();

      expect(find.text('Opções'), findsOneWidget);
      expect(find.text('Compartilhar'), findsOneWidget);
    });

    testWidgets('fecha o bottom sheet ao arrastar para baixo', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    AppBottomSheet.show(
                      context,
                      title: 'Opções',
                      children: [
                        const Text('Compartilhar'),
                      ],
                    );
                  },
                  child: const Text('Abrir'),
                );
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Abrir'));
      await tester.pumpAndSettle();

      expect(find.text('Opções'), findsOneWidget);

      await tester.drag(find.text('Opções'), const Offset(0, 300));
      await tester.pumpAndSettle();

      expect(find.text('Opções'), findsNothing);
    });

  });

}