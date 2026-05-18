import 'package:flutter/material.dart';
import '../../../../../core/auth/auth_service.dart';
import '../../../../dev/fakes/fake_jwt.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  Future<void> _login(BuildContext context) async {
    // utilizando fake para testes... quando integrado com api, alterar
    final fakeAccessToken = generateFakeJwt();
    final fakeRefreshToken = generateFakeJwt();

    await AuthService.instance.login(
      accessToken: fakeAccessToken,
      refreshToken: fakeRefreshToken,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: ElevatedButton(
          onPressed: () => _login(context),
          child: const Text('FAKE LOGIN'),
        ),
      ),
    );
  }
}