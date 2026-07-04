import 'package:conectaparana/features/search/data/search_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia grupos e envia filtros suportados pelo backend', () async {
    Map<String, dynamic>? query;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          query = Map<String, dynamic>.from(options.queryParameters);
          handler.resolve(
            Response(
              requestOptions: options,
              data: {
                'locals': {
                  'items': [
                    {
                      'id': 'loc_1',
                      'name': 'UBS Zona 7',
                      'address': 'Rua das Flores',
                    },
                  ],
                  'total': 1,
                },
                'news': {
                  'items': [
                    {'id': 'nws_1', 'title': 'Notícia da UBS'},
                  ],
                  'total': 1,
                },
              },
            ),
          );
        },
      ),
    );

    final result = await SearchRepository(dio: dio).search(
      query: 'ubs zona',
      cityId: 'cit_01KW62B7AYZNW0KF896RH3JJ82',
      types: SearchResultType.news,
    );

    expect(query?['q'], 'ubs zona');
    expect(
      query?['cityId'],
      'cit_01KW62B7AYZNW0KF896RH3JJ82',
    );
    expect(query?['types'], 'news');
    expect(query?.containsKey('cityIds'), isFalse);
    expect(query?.containsKey('type'), isFalse);
    expect(query?.containsKey('distanceKm'), isFalse);
    expect(result.total, 2);
    expect(result.items.map((item) => item.types), [
      SearchResultType.locals,
      SearchResultType.news,
    ]);
  });

  test('converte todos os tipos para os identificadores plurais da API', () async {
    final sentTypes = <String>[];
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          sentTypes.add(options.queryParameters['types'] as String);
          handler.resolve(
            Response<Map<String, dynamic>>(
              requestOptions: options,
              data: const {},
            ),
          );
        },
      ),
    );
    final repository = SearchRepository(dio: dio);

    for (final type in SearchResultType.values) {
      await repository.search(query: 'teste', types: type);
    }

    expect(sentTypes, ['locals', 'news', 'events', 'communicates']);
  });
}
