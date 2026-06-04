import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Início')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Início'),

            ElevatedButton(
              onPressed: () {
                context.push('/styleguide');
              },
              child: const Text('Abrir Styleguide'),
            ),
          ],
        ),
      ),
    );
  }
}
