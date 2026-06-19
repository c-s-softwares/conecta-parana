import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:conectaparana/features/favorites/data/favorites_service.dart';
import 'package:conectaparana/features/favorites/pages/favorites_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeFavoritesService extends FavoritesService {
  FakeFavoritesService(this.items, {this.shouldFail = false});

  final List<FavoriteItemModel> items;
  final bool shouldFail;

  @override
  Future<List<FavoriteItemModel>> getMyFavorites() async {
    if (shouldFail) {
      throw Exception('network');
    }

    return items;
  }
}

Widget buildTestWidget(FavoritesService service) {
  return MaterialApp(home: FavoritesPage(service: service));
}

void main() {
  testWidgets('renderiza itens agrupados por seção', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        FakeFavoritesService([
          const FavoriteItemModel(
            id: '1',
            title: 'Evento teste',
            type: FavoriteItemType.event,
            isAvailable: true,
          ),
          const FavoriteItemModel(
            id: '2',
            title: 'Notícia teste',
            type: FavoriteItemType.news,
            isAvailable: true,
          ),
        ]),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Eventos (1)'), findsOneWidget);
    expect(find.text('Evento teste'), findsOneWidget);
    expect(find.text('Notícias (1)'), findsOneWidget);
    expect(find.text('Notícia teste'), findsOneWidget);
  });

  testWidgets('exibe EmptyState quando lista está vazia', (tester) async {
    await tester.pumpWidget(buildTestWidget(FakeFavoritesService([])));

    await tester.pumpAndSettle();

    expect(
      find.text('Você ainda não salvou nada. Toque no bookmark para guardar.'),
      findsOneWidget,
    );
  });

  testWidgets('item removido exibe badge e bloqueia navegação', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        FakeFavoritesService([
          const FavoriteItemModel(
            id: '1',
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

  testWidgets('omite seção vazia', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(
        FakeFavoritesService([
          const FavoriteItemModel(
            id: '1',
            title: 'Local teste',
            type: FavoriteItemType.local,
            isAvailable: true,
          ),
        ]),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Locais (1)'), findsOneWidget);
    expect(find.text('Local teste'), findsOneWidget);

    expect(find.textContaining('Eventos'), findsNothing);
    expect(find.textContaining('Comunicados'), findsNothing);
    expect(find.textContaining('Notícias'), findsNothing);
  });

  testWidgets('exibe estado de erro com tentar novamente', (tester) async {
    await tester.pumpWidget(
      buildTestWidget(FakeFavoritesService([], shouldFail: true)),
    );

    await tester.pumpAndSettle();

    expect(find.text('Não foi possível carregar seus salvos.'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);
  });
}
