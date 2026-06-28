import 'package:conectaparana/features/register/data/models/services/register_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

const _validCityId = 'cit_01ARZ3NDEKTSV4RRFFQ69G5FAV';

void main() {
  test('envia cityId ULID na chave esperada pelo backend', () async {
    Map<String, dynamic>? capturedBody;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          capturedBody = Map<String, dynamic>.from(options.data as Map);
          handler.resolve(
            Response(
              requestOptions: options,
              data: {'message': 'Cadastro realizado'},
            ),
          );
        },
      ),
    );

    await RegisterRepository(dio: dio).register(
      name: 'Camila Silva',
      email: 'camila@email.com',
      password: 'Senha@123',
      confirmPassword: 'Senha@123',
      cityId: '  $_validCityId  ',
    );

    expect(capturedBody?['cityId'], _validCityId);
    expect(capturedBody?.containsKey('city_id'), isFalse);
    expect(capturedBody?.containsKey('city'), isFalse);
  });

  test('bloqueia id demo antes de chamar POST register', () async {
    var requestCount = 0;
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requestCount++;
          handler.resolve(Response(requestOptions: options, data: const {}));
        },
      ),
    );

    expect(
      () => RegisterRepository(dio: dio).register(
        name: 'Camila Silva',
        email: 'camila@email.com',
        password: 'Senha@123',
        confirmPassword: 'Senha@123',
        cityId: 'maringa',
      ),
      throwsA(isA<InvalidRegistrationCityException>()),
    );
    expect(requestCount, 0);
  });
}
