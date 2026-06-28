import 'package:conectaparana/features/events/data/services/event_address_resolver.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class _MockDio extends Mock implements Dio {}

void main() {
  test('resolve localId usando o address retornado por GET /locals/:id', () async {
    final dio = _MockDio();
    final resolver = EventAddressResolver(dio);
    final requestOptions = RequestOptions(path: '/locals/loc_01');

    when(() => dio.get<Map<String, dynamic>>('/locals/loc_01')).thenAnswer(
      (_) async => Response(
        requestOptions: requestOptions,
        data: {
          'id': 'loc_01',
          'name': 'Praca da Catedral',
          'address': 'Av. Tiradentes, 100 - Centro',
        },
      ),
    );

    final event = <String, dynamic>{'localId': 'loc_01'};
    final addresses = await resolver.resolve([event]);

    expect(
      resolver.addressFor(event, addresses),
      'Av. Tiradentes, 100 - Centro',
    );
  });

  test('mantem fallback quando localId ou address nao existem', () async {
    final resolver = EventAddressResolver(_MockDio());
    const event = <String, dynamic>{};

    final addresses = await resolver.resolve([event]);

    expect(resolver.addressFor(event, addresses), 'Local a definir');
  });
}
