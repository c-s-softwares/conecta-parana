import 'package:conectaparana/features/suggestions/domain/entities/suggestion.dart';
import 'package:conectaparana/features/suggestions/domain/repositories/suggestion_repository.dart';
import 'package:conectaparana/features/suggestions/presentation/pages/new_suggestion_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NewSuggestionPage', () {
    testWidgets('mantém botão desabilitado quando campos estão vazios', (
      tester,
    ) async {
      final repository = _TestSuggestionRepository();

      await _pumpPage(tester, repository);

      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('new_suggestion_submit_button')),
      );

      expect(button.onPressed, isNull);
      expect(find.text('0 / 1000'), findsOneWidget);
    });

    testWidgets('mostra erro inline quando assunto e mensagem ficam vazios', (
      tester,
    ) async {
      final repository = _TestSuggestionRepository();

      await _pumpPage(tester, repository);

      await tester.enterText(
        find.byKey(const Key('new_suggestion_subject_field')),
        'Praça nova',
      );
      await tester.pump();

      await tester.enterText(
        find.byKey(const Key('new_suggestion_subject_field')),
        '',
      );
      await tester.pump();

      await tester.enterText(
        find.byKey(const Key('new_suggestion_message_field')),
        'Mensagem válida',
      );
      await tester.pump();

      await tester.enterText(
        find.byKey(const Key('new_suggestion_message_field')),
        '',
      );
      await tester.pump();

      expect(find.text('Informe o assunto.'), findsOneWidget);
      expect(find.text('Informe a mensagem.'), findsOneWidget);

      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('new_suggestion_submit_button')),
      );

      expect(button.onPressed, isNull);
    });

    testWidgets(
      'contador fica vermelho e botão desabilita quando mensagem passa de 1000 caracteres',
      (tester) async {
        final repository = _TestSuggestionRepository();
        final longMessage = 'a' * 1001;

        await _pumpPage(tester, repository);

        await tester.enterText(
          find.byKey(const Key('new_suggestion_subject_field')),
          'Praça nova',
        );
        await tester.pump();

        await tester.enterText(
          find.byKey(const Key('new_suggestion_message_field')),
          longMessage,
        );
        await tester.pump();

        expect(find.text('1001 / 1000'), findsOneWidget);

        final counter = tester.widget<Text>(
          find.byKey(const Key('new_suggestion_message_counter')),
        );

        expect(counter.style?.color, Colors.red);

        final button = tester.widget<ElevatedButton>(
          find.byKey(const Key('new_suggestion_submit_button')),
        );

        expect(button.onPressed, isNull);
      },
    );

    testWidgets('submit ok volta com resultado true', (tester) async {
      final repository = _TestSuggestionRepository();

      await _pumpSuccessHost(tester, repository);

      await tester.tap(find.byKey(const Key('open_new_suggestion_button')));
      await tester.pumpAndSettle();

      await _fillValidForm(tester);
      await _tapSubmitButton(tester);

      expect(repository.createCalls, 1);
      expect(repository.createdSubject, 'Praça nova');
      expect(
        repository.createdMessage,
        'Seria ótimo ter uma praça no Jardim Aclimação',
      );
      expect(repository.createdCategory, 'Mobilidade urbana');

      expect(find.text('Voltou true'), findsOneWidget);
    });

    testWidgets('falha de rede mostra snackbar e preserva conteúdo digitado', (
      tester,
    ) async {
      final repository = _TestSuggestionRepository(
        errorToThrow: const SuggestionNetworkException(),
      );

      await _pumpPage(tester, repository);

      await _fillValidForm(tester);
      await _tapSubmitButton(tester);

      expect(
        find.text('Não foi possível enviar a sugestão. Tente novamente.'),
        findsOneWidget,
      );

      expect(find.text('Praça nova'), findsOneWidget);
      expect(
        find.text('Seria ótimo ter uma praça no Jardim Aclimação'),
        findsOneWidget,
      );
      expect(repository.createCalls, 1);
    });

    testWidgets('user_without_city mostra snackbar correto e não navega', (
      tester,
    ) async {
      final repository = _TestSuggestionRepository(
        errorToThrow: const SuggestionUserWithoutCityException(),
      );

      await _pumpPage(tester, repository);

      await _fillValidForm(tester);
      await _tapSubmitButton(tester);

      expect(
        find.text('Selecione sua cidade na Home antes de enviar.'),
        findsOneWidget,
      );

      expect(find.text('Nova Sugestão'), findsOneWidget);
      expect(repository.createCalls, 1);
    });

    testWidgets('message_too_long mostra erro inline e preserva conteúdo', (
      tester,
    ) async {
      final repository = _TestSuggestionRepository(
        errorToThrow: const SuggestionMessageTooLongException(),
      );

      await _pumpPage(tester, repository);

      await _fillValidForm(tester);
      await _tapSubmitButton(tester);

      expect(
        find.text('Mensagem muito longa. Reduza para até 1000 caracteres.'),
        findsOneWidget,
      );

      expect(find.text('Praça nova'), findsOneWidget);
      expect(
        find.text('Seria ótimo ter uma praça no Jardim Aclimação'),
        findsOneWidget,
      );
      expect(repository.createCalls, 1);
    });
  });
}

Future<void> _pumpPage(
  WidgetTester tester,
  SuggestionRepository repository,
) async {
  await _setLargeTestScreen(tester);

  await tester.pumpWidget(
    MaterialApp(home: NewSuggestionPage(repository: repository)),
  );

  await tester.pumpAndSettle();
}

Future<void> _pumpSuccessHost(
  WidgetTester tester,
  SuggestionRepository repository,
) async {
  await _setLargeTestScreen(tester);

  await tester.pumpWidget(_SuccessHost(repository: repository));

  await tester.pumpAndSettle();
}

Future<void> _setLargeTestScreen(WidgetTester tester) async {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1;

  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

Future<void> _fillValidForm(WidgetTester tester) async {
  await tester.enterText(
    find.byKey(const Key('new_suggestion_subject_field')),
    'Praça nova',
  );
  await tester.pump();

  await tester.enterText(
    find.byKey(const Key('new_suggestion_message_field')),
    'Seria ótimo ter uma praça no Jardim Aclimação',
  );
  await tester.pump();
}

Future<void> _tapSubmitButton(WidgetTester tester) async {
  final submitButton = find.byKey(const Key('new_suggestion_submit_button'));

  await tester.ensureVisible(submitButton);
  await tester.pumpAndSettle();

  await tester.tap(submitButton);
  await tester.pumpAndSettle();
}

class _TestSuggestionRepository implements SuggestionRepository {
  _TestSuggestionRepository({this.errorToThrow});

  final Object? errorToThrow;

  int createCalls = 0;
  String? createdSubject;
  String? createdMessage;
  String? createdCategory;

  @override
  Future<List<Suggestion>> getMySuggestions() async {
    return [];
  }

  @override
  Future<void> createSuggestion({
    required String subject,
    required String message,
    required String category,
  }) async {
    createCalls++;
    createdSubject = subject;
    createdMessage = message;
    createdCategory = category;

    if (errorToThrow != null) {
      throw errorToThrow!;
    }
  }
}

class _SuccessHost extends StatefulWidget {
  const _SuccessHost({required this.repository});

  final SuggestionRepository repository;

  @override
  State<_SuccessHost> createState() => _SuccessHostState();
}

class _SuccessHostState extends State<_SuccessHost> {
  bool _returnedTrue = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) {
            return Column(
              children: [
                ElevatedButton(
                  key: const Key('open_new_suggestion_button'),
                  onPressed: () async {
                    final result = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(
                        builder: (_) =>
                            NewSuggestionPage(repository: widget.repository),
                      ),
                    );

                    if (!mounted) return;

                    setState(() {
                      _returnedTrue = result == true;
                    });
                  },
                  child: const Text('Abrir Nova Sugestão'),
                ),
                Text(_returnedTrue ? 'Voltou true' : 'Ainda não voltou'),
              ],
            );
          },
        ),
      ),
    );
  }
}
