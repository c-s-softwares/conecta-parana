// DEV ONLY
// Tela de preview dos cenários da EventDetailPage sem backend.
// Acessível via botão na HomePage em modo dev.

import 'package:flutter/material.dart';
import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:conectaparana/dev/fakes/fake_event_repository.dart';
import 'package:conectaparana/features/events/presentation/pages/event_detail_page.dart';

class EventDetailPreviewScreen extends StatelessWidget {
  const EventDetailPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      appBar: AppBar(
        title: const Text(
          'Preview — Detalhe de Evento',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFEEEEEE)),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const _SectionLabel('Cenários de conteúdo'),
          _ScenarioCard(
            title: 'Evento completo',
            subtitle: 'Com fotos, mapa, local e engajamento',
            icon: Icons.celebration_outlined,
            color: AppTheme.primaryGreen,
            onTap: () => _open(context, 'evt_fake_completo'),
          ),
          _ScenarioCard(
            title: 'Sem fotos e sem mapa',
            subtitle:
                'Layout reduzido, sem carrossel e sem seção de localização',
            icon: Icons.text_snippet_outlined,
            color: AppTheme.teal,
            onTap: () => _open(context, 'evt_fake_simples'),
          ),
          _ScenarioCard(
            title: 'Evento cancelado',
            subtitle: 'Banner vermelho no topo da tela',
            icon: Icons.cancel_outlined,
            color: const Color(0xFFE53935),
            onTap: () => _open(context, 'evt_fake_cancelado'),
          ),
          const SizedBox(height: 16),
          const _SectionLabel('Cenários de erro'),
          _ScenarioCard(
            title: '404 — Evento não encontrado',
            subtitle: 'EmptyState com botão Voltar',
            icon: Icons.search_off_outlined,
            color: AppTheme.mustard,
            onTap: () =>
                _open(context, 'evt_fake_completo', simulateNotFound: true),
          ),
          _ScenarioCard(
            title: 'Erro de rede',
            subtitle: 'Estado de erro com botão Tentar novamente',
            icon: Icons.wifi_off_outlined,
            color: Colors.grey,
            onTap: () =>
                _open(context, 'evt_fake_completo', simulateNetworkError: true),
          ),
          const SizedBox(height: 16),
          const _SectionLabel('Latência simulada'),
          _ScenarioCard(
            title: 'Sem delay',
            subtitle: 'Carregamento instantâneo',
            icon: Icons.bolt_outlined,
            color: AppTheme.primaryGreen,
            onTap: () =>
                _open(context, 'evt_fake_completo', delay: Duration.zero),
          ),
          _ScenarioCard(
            title: 'Delay longo (3s)',
            subtitle: 'Ver o estado de loading por mais tempo',
            icon: Icons.hourglass_empty_outlined,
            color: AppTheme.mustard,
            onTap: () => _open(
              context,
              'evt_fake_completo',
              delay: const Duration(seconds: 3),
            ),
          ),
        ],
      ),
    );
  }

  void _open(
    BuildContext context,
    String eventId, {
    bool simulateNotFound = false,
    bool simulateNetworkError = false,
    Duration delay = const Duration(milliseconds: 800),
  }) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EventDetailPage(
          eventId: eventId,
          repository: FakeEventRepository(
            delay: delay,
            simulateNotFound: simulateNotFound,
            simulateNetworkError: simulateNetworkError,
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Colors.grey,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _ScenarioCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ScenarioCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: Color(0xFFE8E8E8)),
      ),
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  // ignore: deprecated_member_use
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF888888),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
