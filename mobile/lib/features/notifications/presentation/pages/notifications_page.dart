import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        child: Column(
          children: [
            _NotificationsHeader(onBack: () => context.pop()),
            const Expanded(child: NotificationsEmptyState()),
          ],
        ),
      ),
    );
  }
}

class _NotificationsHeader extends StatelessWidget {
  const _NotificationsHeader({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
      child: Row(
        children: [
          Material(
            color: const Color(0xFFEEF1F2),
            shape: const CircleBorder(),
            child: IconButton(
              key: const Key('notifications_back_button'),
              tooltip: 'Voltar',
              onPressed: onBack,
              icon: const Icon(
                Icons.chevron_left,
                size: 28,
                color: Color(0xFF0C1714),
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Notificações',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Color(0xFF0C1714),
                fontSize: 28,
                fontWeight: FontWeight.w900,
                height: 1.05,
              ),
            ),
          ),
          TextButton(
            key: const Key('notifications_mark_all_button'),
            onPressed: null,
            style: TextButton.styleFrom(
              disabledForegroundColor: const Color(0xFF006B39).withAlpha(100),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
            ),
            child: const Text(
              'Marcar todas',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

class NotificationsEmptyState extends StatelessWidget {
  const NotificationsEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(32, 24, 32, 64),
        child: Semantics(
          label: 'Nenhuma notificação',
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 104,
                height: 104,
                decoration: const BoxDecoration(
                  color: Color(0xFFE4F3EA),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_off_outlined,
                  size: 48,
                  color: Color(0xFF00733E),
                ),
              ),
              const SizedBox(height: 26),
              const Text(
                'Tudo em dia por aqui!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF0C1714),
                  fontSize: 23,
                  fontWeight: FontWeight.w900,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 10),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 330),
                child: const Text(
                  'Quando surgirem alertas de utilidade pública, eventos ou atualizações dos seus tickets, eles aparecerão aqui.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF68716E),
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    height: 1.45,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
