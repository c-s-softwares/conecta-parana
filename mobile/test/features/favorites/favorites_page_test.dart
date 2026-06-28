import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:conectaparana/features/favorites/data/favorites_service.dart';
import 'package:conectaparana/features/favorites/pages/favorites_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeFavoritesService extends FavoritesService {
  FakeFavoritesService(
    List<FavoriteItemModel> items, {
    this.shouldFailLoad = false,
    this.shouldFailRemove = false,
  }) : items = [...items];

  final List<FavoriteItemModel> items;
  final bool shouldFailLoad;
  final bool shouldFailRemove;
  int removeCalls = 0;

  @override
  Future<List<FavoriteItemModel>> getMyFavorites() async {
    if (shouldFailLoad) throw Exception('network');
    return [...items];
  }

  @override
  Future<void> remove(FavoriteItemModel item) async {
    removeCalls++;
    if (shouldFailRemove) throw Exception('network');
    items.removeWhere((candidate) => candidate.id == item.id);
  }
}

Widget buildTestWidget(FavoritesService service) {
  return MaterialApp(home: FavoritesPage(service: service));
}

const _news = FavoriteItemModel(
  id: 'news_1',
  title: 'Notícia teste',
  type: FavoriteItemType.news,
  isAvailable: true,
  category: 'meio ambiente',
);

const _event = FavoriteItemModel(
  id: 'event_1',
  title: 'Evento teste',
  type: FavoriteItemType.event,
  isAvailable: true,
  category: 'cultura',
);

const _local = FavoriteItemModel(
  id: 'local_1',
  title: 'Local teste',
  type: FavoriteItemType.local,
  isAvailable: true,
);

const _communicate = FavoriteItemModel(
  id: 'communicate_1',
  title: 'Comunicado teste',
  type: FavoriteItemType.communicate,
  isAvailable: true,
);

void main() {
  testWidgets('renderiza cabecalho, contador, filtros e cards unificados', (
    tester,
  ) async {
    await tester.pumpWidget(
      buildTestWidget(
        FakeFavoritesService([_news, _event, _local, _communicate]),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Salvos'), findsOneWidget);
    expect(find.text('4 itens'), findsOneWidget);
    expect(find.text('SALVOS RECENTEMENTE'), findsOneWidget);
    expect(find.text('Todos'), findsOneWidget);
    expect(find.text('Notícias'), findsOneWidget);
    expect(find.text('Eventos'), findsOneWidget);
    expect(find.text('Locais'), findsOneWidget);
    expect(find.text('Notícia teste'), findsOneWidget);
    expect(find.text('EVENTO • CULTURA'), findsOneWidget);
    expect(find.byIcon(Icons.bookmark), findsNWidgets(4));
  });

  testWidgets('chips filtram a lista sem nova requisicao', (tester) async {
    final service = FakeFavoritesService([_news, _event, _local, _communicate]);
    await tester.pumpWidget(buildTestWidget(service));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Notícias'));
    await tester.pump();
    expect(find.text('Notícia teste'), findsOneWidget);
    expect(find.text('Evento teste'), findsNothing);
    expect(find.text('Comunicado teste'), findsNothing);

    await tester.tap(find.text('Eventos'));
    await tester.pump();
    expect(find.text('Evento teste'), findsOneWidget);
    expect(find.text('Notícia teste'), findsNothing);

    await tester.tap(find.text('Locais'));
    await tester.pump();
    expect(find.text('Local teste'), findsOneWidget);

    await tester.tap(find.text('Todos'));
    await tester.pump();
    expect(find.text('Comunicado teste'), findsOneWidget);
    expect(find.text('4 itens'), findsOneWidget);
  });

  testWidgets('bookmark remove item e atualiza contador imediatamente', (
    tester,
  ) async {
    final service = FakeFavoritesService([_news, _event]);
    await tester.pumpWidget(buildTestWidget(service));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('remove_favorite_news_1')));
    await tester.pumpAndSettle();

    expect(service.removeCalls, 1);
    expect(find.text('Notícia teste'), findsNothing);
    expect(find.text('1 item'), findsOneWidget);
  });

  testWidgets('falha ao remover restaura item e mostra erro', (tester) async {
    final service = FakeFavoritesService([_news], shouldFailRemove: true);
    await tester.pumpWidget(buildTestWidget(service));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('remove_favorite_news_1')));
    await tester.pumpAndSettle();

    expect(find.text('Notícia teste'), findsOneWidget);
    expect(find.text('Não foi possível atualizar os salvos.'), findsOneWidget);
  });

  testWidgets('exibe estado vazio', (tester) async {
    await tester.pumpWidget(buildTestWidget(FakeFavoritesService([])));
    await tester.pumpAndSettle();

    expect(find.text('Você ainda não salvou nada'), findsOneWidget);
    expect(find.text('0 itens'), findsOneWidget);
  });

  testWidgets('item indisponivel bloqueia navegacao', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        FakeFavoritesService([
          const FavoriteItemModel(
            id: 'removed_1',
            title: 'Conteúdo removido',
            type: FavoriteItemType.news,
            isAvailable: false,
          ),
        ]),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Removido'), findsOneWidget);
    await tester.tap(find.text('Conteúdo removido'));
    await tester.pump();
    expect(find.text('Conteúdo não está mais disponível.'), findsOneWidget);
  });

  testWidgets('exibe estado de erro com tentar novamente', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(FakeFavoritesService([], shouldFailLoad: true)),
    );
    await tester.pumpAndSettle();

    expect(find.text('Não foi possível carregar seus salvos.'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);
  });
}
