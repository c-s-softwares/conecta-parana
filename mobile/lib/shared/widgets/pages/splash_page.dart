import 'package:flutter/material.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  bool _mostrarCarregando = false;

  @override
  void initState() {
    super.initState();
    _iniciarContagem();
  }

  void _iniciarContagem() async {
    await Future.delayed(const Duration(seconds: 5));
    if (mounted) {
      setState(() {
        _mostrarCarregando = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/paranalogo.png',
              width: 150,
            ),
            if (_mostrarCarregando) ...[
              const SizedBox(height: 24),
              const Text(
                'Carregando...',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 16),
              const CircularProgressIndicator(
                color: Color(0xFF006733),
              ),
            ]
          ],
        ),
      ),
    );
  }
}