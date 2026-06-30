import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key, this.authService});

  final AuthService? authService;

  Future<void> _logout(BuildContext context) async {
    await (authService ?? AuthService.instance).logout();

    if (!context.mounted) return;
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Container(
            key: const Key('profile_development_banner'),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF7F1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFB7DEC4)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, color: Color(0xFF006733)),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'A função de perfil estará disponível em breve!',
                    style: TextStyle(
                      color: Color(0xFF163B27),
                      fontWeight: FontWeight.w600,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            margin: EdgeInsets.zero,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E5E5)),
            ),
            child: ListTile(
              key: const Key('profile_suggestions_tile'),
              leading: const Icon(Icons.lightbulb_outline),
              title: const Text('Minhas Sugestões'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/profile/suggestions'),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E5E5)),
            ),
            child: ListTile(
              key: const Key('profile_tickets_tile'),
              leading: const Icon(Icons.confirmation_number_outlined),
              title: const Text('Meus Tickets'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/profile/tickets'),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            margin: EdgeInsets.zero,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E5E5)),
            ),
            child: ListTile(
              key: const Key('profile_favorites_tile'),
              leading: const Icon(Icons.bookmark_outline),
              title: const Text('Salvos'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/profile/favorites'),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            key: const Key('profile_logout_button'),
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout),
            label: const Text('Sair da conta'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFB3261E),
              side: const BorderSide(color: Color(0xFFB3261E)),
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
