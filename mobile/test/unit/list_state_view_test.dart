import 'package:conectaparana/shared/widgets/misc/list_state_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const skeletonKey = Key('skeleton');
  const dataKey = Key('data');

  Widget wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

  ListStateView build({
    bool isLoading = false,
    bool hasError = false,
    bool isEmpty = false,
    bool hasActiveFilters = false,
    VoidCallback? onRetry,
    VoidCallback? onClearFilters,
    VoidCallback? onEmptyAction,
    String emptyTitle = 'Vazio natural',
    String? emptyActionLabel,
  }) {
    return ListStateView(
      isLoading: isLoading,
      hasError: hasError,
      isEmpty: isEmpty,
      hasActiveFilters: hasActiveFilters,
      onRetry: onRetry,
      onClearFilters: onClearFilters,
      onEmptyAction: onEmptyAction,
      emptyTitle: emptyTitle,
      emptyActionLabel: emptyActionLabel,
      loadingSkeleton: const SizedBox(key: skeletonKey, height: 40),
      builder: (_) => const SizedBox(key: dataKey, height: 40),
    );
  }

  group('ListStateView', () {
    testWidgets('skeleton só aparece depois de 200ms', (tester) async {
      await tester.pumpWidget(wrap(build(isLoading: true)));

      await tester.pump(const Duration(milliseconds: 100));
      expect(find.byKey(skeletonKey), findsNothing); 

      await tester.pump(const Duration(milliseconds: 150)); 
      expect(find.byKey(skeletonKey), findsOneWidget); 
    });

    testWidgets('erro mostra "Tentar novamente" e dispara onRetry',
        (tester) async {
      var retried = false;
      await tester.pumpWidget(
        wrap(build(hasError: true, onRetry: () => retried = true)),
      );

      expect(find.text('Tentar novamente'), findsOneWidget);
      await tester.tap(find.text('Tentar novamente'));
      expect(retried, isTrue);
    });

    testWidgets('vazio natural mostra título e ação contextual',
        (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        wrap(build(
          isEmpty: true,
          emptyTitle: 'Você ainda não abriu tickets.',
          emptyActionLabel: 'Abrir o primeiro',
          onEmptyAction: () => tapped = true,
        )),
      );

      expect(find.text('Você ainda não abriu tickets.'), findsOneWidget);
      await tester.tap(find.text('Abrir o primeiro'));
      expect(tapped, isTrue);
    });

    testWidgets('vazio com filtros mostra mensagem e "Limpar filtros"',
        (tester) async {
      var cleared = false;
      await tester.pumpWidget(
        wrap(build(
          isEmpty: true,
          hasActiveFilters: true,
          onClearFilters: () => cleared = true,
        )),
      );

      expect(find.text('Nenhum resultado pelos filtros.'), findsOneWidget);
      await tester.tap(find.text('Limpar filtros'));
      expect(cleared, isTrue);
    });

    testWidgets('com dados renderiza o builder', (tester) async {
      await tester.pumpWidget(wrap(build()));
      expect(find.byKey(dataKey), findsOneWidget);
    });
  });
}