import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

const _cityId = 'cit_01KW62B7AYZNW0KF896RH3JJ82';

Map<String, dynamic> _responseBody() => {
  'items': [
    {
      'id': 'evt_01KW62B7B2GMWE1M77F2EV5JS4',
      'title': 'Feira de Saúde Preventiva',
      'description': 'Serviços gratuitos',
      'type': 'oficial',
      'isActive': true,
      'eventDate': '2026-07-05T02:53:39.554Z',
      'cityId': _cityId,
      'photos': [
        {'id': 'pho_1', 'thumbUrl': 'https://cdn.test/event-thumb.webp'},
      ],
      'address': 'Praça Central',
    },
  ],
  'total': 1,
  'page': 1,
  'pageSize': 10,
};

void main() {
  test('usa isActive e cityId conforme QueryEventsDto', () async {
    Map<String, dynamic>? capturedQuery;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          capturedQuery = Map<String, dynamic>.from(options.queryParameters);
          handler.resolve(
            Response(requestOptions: options, data: _responseBody()),
          );
        },
      ),
    );

    final page = await RemoteEventRepository(
      dio: dio,
    ).getEvents(cityId: _cityId);

    expect(capturedQuery?['cityId'], _cityId);
    expect(capturedQuery?['isActive'], isTrue);
    expect(capturedQuery?['status'], isNull);
    expect(capturedQuery?['order'], 'date_asc');
    expect(
      page.items.single.photos.single.displayUrl,
      'https://cdn.test/event-thumb.webp',
    );
    expect(page.items.single.title, 'Feira de Saúde Preventiva');
    expect(page.items.single.location, 'Praça Central');
  });

  test('omite filtro de cidade quando id ativo e invalido', () async {
    Map<String, dynamic>? capturedQuery;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          capturedQuery = Map<String, dynamic>.from(options.queryParameters);
          handler.resolve(
            Response(requestOptions: options, data: _responseBody()),
          );
        },
      ),
    );

    await RemoteEventRepository(dio: dio).getEvents(cityId: 'maringa');

    expect(capturedQuery?.containsKey('cityId'), isFalse);
    expect(capturedQuery?['isActive'], isTrue);
  });
}
