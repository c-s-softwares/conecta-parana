import 'package:conectaparana/core/auth/auth_event.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';
import 'package:conectaparana/shared/widgets/placeholder_screen.dart';
import 'package:flutter/material.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();

    AuthService.instance.events.listen((event) {
      if (!mounted) return;

      if (event == AuthEvent.adminNotAllowed) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Use o painel web para administrar.')),
          );
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: AuthService.instance.currentUser,
      builder: (context, user, _) {
        if (user == null) {
          return const LoginScreen();
        } else {
          return const PlaceholderScreen();
        }
      },
    );
  }
}
