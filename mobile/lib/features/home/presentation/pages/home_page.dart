import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:conectaparana/dev/event_detail_preview_screen.dart';

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

            if (kDebugMode) ...[
              const SizedBox(height: 24),
              const Divider(indent: 40, endIndent: 40),
              const SizedBox(height: 8),
              const Text(
                'DEV',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const EventDetailPreviewScreen(),
                  ),
                ),
                icon: const Icon(Icons.event_outlined, size: 16),
                label: const Text('Preview — Detalhe de Evento'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF006733),
                  side: const BorderSide(color: Color(0xFF006733)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
