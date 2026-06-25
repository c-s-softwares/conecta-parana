import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:conectaparana/features/suggestions/domain/entities/suggestion.dart';
import 'package:conectaparana/features/suggestions/domain/repositories/suggestion_repository.dart';
import 'package:conectaparana/features/suggestions/presentation/providers/suggestions_notifier.dart';
import 'package:conectaparana/features/suggestions/presentation/pages/suggestions_page.dart';

class _MockSuggestionRepository extends Mock implements SuggestionRepository {}

Widget _wrap(Widget child) => MaterialApp(home: child);

Suggestion _suggestion({
  String id = 'S12',
  String category = 'Mobilidade',
  String subject = 'Ciclovia na Av. Brasil',
  SuggestionStatus status = SuggestionStatus.respondida,
  String message = 'Mensagem da sugestao do cidadao.',
  SuggestionReply? reply,
}) {
  return Suggestion(
    id: id,
    category: category,
    subject: subject,
    status: status,
    createdAt: DateTime(2026, 4, 22),
    message: message,
    reply: reply,
  );
}

void main() {
  testWidgets('Renderiza a lista com as sugestoes carregadas', (tester) async {
    final repo = _MockSuggestionRepository();
    when(() => repo.getMySuggestions()).thenAnswer(
      (_) async => [
        _suggestion(
          subject: 'Ciclovia na Av. Brasil',
          status: SuggestionStatus.respondida,
        ),
        _suggestion(
          id: 'S11',
          subject: 'Mais arvores na rua',
          status: SuggestionStatus.lida,
        ),
      ],
    );

    final notifier = SuggestionsNotifier(repository: repo);
    addTearDown(notifier.dispose);
    await notifier.load();

    await tester.pumpWidget(_wrap(SuggestionsPage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    expect(find.text('Ciclovia na Av. Brasil'), findsOneWidget);
    expect(find.text('Mais arvores na rua'), findsOneWidget);
    expect(find.text('Respondida'), findsOneWidget); 
  });

  testWidgets('Expande o card e mostra a resposta do admin ao tocar', (
    tester,
  ) async {
    final repo = _MockSuggestionRepository();
    when(() => repo.getMySuggestions()).thenAnswer(
      (_) async => [
        _suggestion(
          subject: 'Ciclovia na Av. Brasil',
          status: SuggestionStatus.respondida,
          reply: SuggestionReply(
            authorName: 'Prefeitura',
            date: DateTime(2026, 4, 26),
            message: 'Resposta da prefeitura ao cidadao.',
          ),
        ),
      ],
    );

    final notifier = SuggestionsNotifier(repository: repo);
    addTearDown(notifier.dispose);
    await notifier.load();

    await tester.pumpWidget(_wrap(SuggestionsPage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    expect(find.text('Resposta da prefeitura ao cidadao.'), findsNothing);

    await tester.tap(find.text('Ciclovia na Av. Brasil'));
    await tester.pumpAndSettle();

    expect(find.text('Resposta da prefeitura ao cidadao.'), findsOneWidget);
    expect(find.text('Prefeitura'), findsOneWidget);
  });

  testWidgets('Mostra o estado vazio quando nao ha sugestoes', (tester) async {
    final repo = _MockSuggestionRepository();
    when(() => repo.getMySuggestions()).thenAnswer((_) async => <Suggestion>[]);

    final notifier = SuggestionsNotifier(repository: repo);
    addTearDown(notifier.dispose);
    await notifier.load();

    await tester.pumpWidget(_wrap(SuggestionsPage(mockNotifier: notifier)));
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.lightbulb_outline), findsOneWidget);
    expect(find.textContaining('Enviar primeira'), findsOneWidget);
  });

  testWidgets(
    'Mostra o estado de erro com "Tentar novamente" em falha de rede',
    (tester) async {
      final repo = _MockSuggestionRepository();
      when(
        () => repo.getMySuggestions(),
      ).thenThrow(const SuggestionNetworkException());

      final notifier = SuggestionsNotifier(repository: repo);
      addTearDown(notifier.dispose);
      await notifier.load();

      await tester.pumpWidget(_wrap(SuggestionsPage(mockNotifier: notifier)));
      await tester.pumpAndSettle();

      expect(find.text('Tentar novamente'), findsOneWidget);
      expect(find.byIcon(Icons.cloud_off_outlined), findsOneWidget);
    },
  );
}