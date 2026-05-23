import 'package:conectaparana/core/network/api_client.dart';

class RegisterRepository {
  Future<({String accessToken, String refreshToken})> register({
    required String name,
    required String email,
    required String password,
    required String cityId,
  }) async {
    final response = await ApiClient.instance.dio.post(
      '/auth/register',
      data: {
        'name':     name,
        'email':    email,
        'password': password,
        'cityId':   cityId,
      },
    );

    return (
      accessToken:  response.data['accessToken']  as String,
      refreshToken: response.data['refreshToken'] as String,
    );
  }
}