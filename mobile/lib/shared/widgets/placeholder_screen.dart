import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key});

  Future<void> _logout() async {
    await AuthService.instance.logout();
  }

  Future<void> _testAuthCall() async {
    await ApiClient.instance.dio.get(
      '/auth/me',
      options: Options(extra: {'auth': true}),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Conecta Paraná')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Conecta Paraná',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text(
              'Ambiente: ${Environment.name}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              Environment.apiBaseUrl,
              style: const TextStyle(fontSize: 14, color: Colors.blueGrey),
            ),

            ElevatedButton(
              onPressed: _testAuthCall,
              child: const Text('TESTAR CHAMADA AUTENTICADA'),
            ),
            ElevatedButton(onPressed: _logout, child: const Text('LOGOUT')),
            ElevatedButton(
              onPressed: () => context.go('/rota-que-nao-existe'),
              child: const Text('Testar 404'),
            ),
          ],
        ),
      ),
    );
  }
}
