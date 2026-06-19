import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.lightbulb_outline),
            title: const Text('Minhas Sugestões'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/suggestions'),
          ),

          ListTile(
            leading: const Icon(Icons.bookmark_outline),
            title: const Text('Meus Salvos'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/favorites'),
          ),
        ],
      ),
    );
  }
}
