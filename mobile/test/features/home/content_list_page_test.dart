import 'package:conectaparana/features/home/data/repositories/content_list_repository.dart';
import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/presentation/pages/content_list_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class _FakeRepository extends ContentListRepository {
  _FakeRepository({this.items = const [], this.error});
  final List<FeedItem> items;
  final Object? error;

  @override
  Future<ContentListResult> load({
    required ContentListKind kind,
    required String? cityId,
    required int page,
    int pageSize = 10,
  }) async {
    if (error != null) throw error!;
    return ContentListResult(items: items, hasMore: false);
  }
}

void main() {
  testWidgets('renderiza comunicados reais carregados', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ContentListPage(
          kind: ContentListKind.communicates,
          repository: _FakeRepository(
            items: const [
              FeedItem(
                id: 'cmt_1',
                type: FeedItemType.comunicado,
                title: 'Comunicado da prefeitura',
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Comunicado da prefeitura'), findsOneWidget);
  });

  testWidgets('abre detalhe de comunicado pela rota da listagem', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/communicates',
      routes: [
        GoRoute(
          path: '/communicates',
          builder: (context, state) => ContentListPage(
            kind: ContentListKind.communicates,
            repository: _FakeRepository(
              items: const [
                FeedItem(
                  id: 'cmt_1',
                  type: FeedItemType.comunicado,
                  title: 'Comunicado da prefeitura',
                ),
              ],
            ),
          ),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) =>
                  Scaffold(body: Text('detail:${state.pathParameters['id']}')),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Comunicado da prefeitura'));
    await tester.pumpAndSettle();

    expect(find.text('detail:cmt_1'), findsOneWidget);
  });

  testWidgets('renderiza estado vazio de notícias', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ContentListPage(
          kind: ContentListKind.news,
          repository: _FakeRepository(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Nenhum conteúdo encontrado'), findsOneWidget);
  });

  testWidgets('renderiza erro com retry', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ContentListPage(
          kind: ContentListKind.news,
          repository: _FakeRepository(error: Exception('network')),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Não foi possível carregar'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);
  });
}
