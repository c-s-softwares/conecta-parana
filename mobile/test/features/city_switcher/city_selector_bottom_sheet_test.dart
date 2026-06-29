import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/features/city_switcher/presentation/widgets/city_selector_bottom_sheet.dart';


void main() {
  const cityA = City(id: 'maringa', name: 'Maringa', state: '');
  const cityB = City(id: 'curitiba', name: 'Curitiba', state: '');

  testWidgets('renderiza a lista de cidades carregadas', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: CitySelectorBottomSheet(loadCities: () async => [cityA, cityB]),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Maringa'), findsOneWidget);
    expect(find.text('Curitiba'), findsOneWidget);
  });

  testWidgets('seleciona uma cidade e a retorna', (tester) async {
    City? selected;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => ElevatedButton(
            onPressed: () async {
              selected = await showCitySelectorBottomSheet(
                context,
                loadCities: () async => [cityA, cityB],
              );
            },
            child: const Text('abrir'),
          ),
        ),
      ),
    ));

    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle(); 
    expect(find.text('Curitiba'), findsOneWidget);

    await tester.tap(find.byKey(const Key('city_selector_city_curitiba')));
    await tester.pumpAndSettle(); 

    expect(selected, isNotNull);
    expect(selected!.id, 'curitiba');
  });

  testWidgets('mostra estado de erro quando a listagem falha', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: CitySelectorBottomSheet(
          loadCities: () async => throw Exception('falha'),
        ),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('city_selector_retry_button')), findsOneWidget);
  });
}