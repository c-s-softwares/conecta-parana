import 'package:conectaparana/features/register/data/models/services/city_model.dart';
import 'package:conectaparana/features/search/data/search_repository.dart';
import 'package:conectaparana/features/search/presentation/pages/search_page.dart';
import 'package:conectaparana/features/search/presentation/widgets/search_filter_panel.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const _city = City(id: 'cit_01KW62B7AYZNW0KF896RH3JJ82', name: 'Maringá');

class _FakeSearchRepository extends SearchRepository {
  int calls = 0;
  String? lastQuery;
  String? lastCityId;
  SearchResultType? lastType;

  @override
  Future<SearchResultPage> search({
    required String query,
    String? cityId,
    SearchResultType? types,
    int limit = 10,
  }) async {
    calls++;
    lastQuery = query;
    lastCityId = cityId;
    lastType = types;
    return const SearchResultPage(
      total: 3,
      items: [
        SearchResultItem(
          id: 'loc_1',
          types: SearchResultType.locals,
          title: 'UBS Zona 7',
          address: 'Rua das Flores',
          detailRoute: '/map/loc_1',
        ),
        SearchResultItem(
          id: 'nws_1',
          types: SearchResultType.news,
          title: 'Decreto nº 1064/2025',
          category: 'meio ambiente',
          detailRoute: '/home/news/nws_1',
        ),
        SearchResultItem(
          id: 'evt_1',
          types: SearchResultType.events,
          title: 'Feira Orgânica do Parque',
          category: 'feira',
          detailRoute: '/events/evt_1',
        ),
      ],
    );
  }
}

Widget _wrap(
  _FakeSearchRepository repository, {
  String query = '',
  SearchInitialCategory? initialCategory,
  SearchCityLoader? cityLoader,
}) {
  return MaterialApp(
    home: SearchPage(
      repository: repository,
      initialQuery: query,
      city: _city,
      initialCategory: initialCategory,
      cityLoader: cityLoader,
    ),
  );
}

void main() {
  testWidgets('digitar busca usa debounce e renderiza cards mistos', (
    tester,
  ) async {
    final repository = _FakeSearchRepository();
    await tester.pumpWidget(_wrap(repository));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const Key('active_search_input')),
      'ubs zona',
    );
    await tester.pump(const Duration(milliseconds: 349));
    expect(repository.calls, 0);
    await tester.pump(const Duration(milliseconds: 1));
    await tester.pumpAndSettle();

    expect(repository.calls, 1);
    expect(repository.lastCityId, _city.id);
    expect(find.text('3 RESULTADOS PARA "UBS ZONA"'), findsOneWidget);
    expect(find.text('UBS Zona 7'), findsOneWidget);
    expect(find.text('Decreto nº 1064/2025'), findsOneWidget);
    expect(find.text('Feira Orgânica do Parque'), findsOneWidget);
    expect(find.text('Não encontrou?'), findsOneWidget);
  });

  testWidgets('limpar texto volta ao estado inicial', (tester) async {
    final repository = _FakeSearchRepository();
    await tester.pumpWidget(_wrap(repository, query: 'ubs zona'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('clear_search_button')));
    await tester.pump();

    expect(find.text('Busque no Conecta Paraná'), findsOneWidget);
    final field = tester.widget<TextField>(
      find.byKey(const Key('active_search_input')),
    );
    expect(field.controller?.text, isEmpty);
  });

  testWidgets('buscar em outras cidades remove cityId da requisicao', (
    tester,
  ) async {
    final repository = _FakeSearchRepository();
    await tester.pumpWidget(_wrap(repository, query: 'ubs zona'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('search_other_cities_button')));
    await tester.pumpAndSettle();

    expect(repository.lastCityId, isNull);
    expect(repository.calls, 2);
  });

  testWidgets('categoria inicial de eventos filtra a primeira busca', (
    tester,
  ) async {
    final repository = _FakeSearchRepository();
    await tester.pumpWidget(
      _wrap(
        repository,
        query: 'feira',
        initialCategory: SearchInitialCategory.events,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Eventos'), findsOneWidget);
    expect(repository.lastType, SearchResultType.events);
  });

  testWidgets('painel aplica uma cidade e um tipo no contrato homologado', (
    tester,
  ) async {
    final repository = _FakeSearchRepository();
    const curitiba = City(
      id: 'cit_01KW62B7B0F4TQQ6MVCMZKKF3E',
      name: 'Curitiba',
    );
    await tester.pumpWidget(
      _wrap(
        repository,
        query: 'feira',
        cityLoader: () async => const [_city, curitiba],
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('open_search_filters_button')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('search_filter_panel')), findsOneWidget);

    await tester.tap(find.byKey(Key('search_city_checkbox_${curitiba.id}')));
    await tester.scrollUntilVisible(
      find.byKey(const Key('search_type_checkbox_news')),
      300,
      scrollable: find.descendant(
        of: find.byKey(const Key('search_filter_panel')),
        matching: find.byType(Scrollable),
      ).first,
    );
    await tester.drag(
      find.descendant(
        of: find.byKey(const Key('search_filter_panel')),
        matching: find.byType(Scrollable),
      ).first,
      const Offset(0, -120),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('search_type_checkbox_news')));
    await tester.tap(find.byKey(const Key('apply_search_filters_button')));
    await tester.pumpAndSettle();

    expect(repository.lastCityId, curitiba.id);
    expect(repository.lastType, SearchResultType.news);
    expect(find.text('Curitiba'), findsOneWidget);
    expect(repository.calls, 2);
  });
}
