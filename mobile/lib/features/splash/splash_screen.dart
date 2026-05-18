import 'dart:async';
import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _showLoading = false;
  bool _showError = false;
  bool _showFatalError = false;
  String? _fatalErrorMessage;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    // Timer de 5s → mostra "Carregando..."
    final slow = Timer(const Duration(seconds: 5), () {
      if (mounted) setState(() => _showLoading = true);
    });

    // Timer de 30s → tela de erro de conexão
    final timeout = Timer(const Duration(seconds: 30), () {
      if (mounted) setState(() => _showError = true);
    });

    try {
      await _initServices();
      slow.cancel();
      timeout.cancel();
      if (!mounted) return;
      _navigate();
    } catch (e, stack) {
      slow.cancel();
      timeout.cancel();
      debugPrint('SPLASH FATAL: $e\n$stack');
      if (mounted) {
        setState(() {
          _showFatalError = true;
          _fatalErrorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _initServices() async {
    // TODO: substituir pelo seu AuthService, HTTP client, locale reais
    // Exemplo:
    // await AuthService.instance.restore();
    // await HttpClient.instance.init();
    await Future.delayed(const Duration(milliseconds: 600)); // simula init
  }

  void _navigate() {
    // TODO: lógica real de rota com base no AuthService
    // final auth = AuthService.instance;
    // if (!auth.isLoggedIn) { go('/login'); return; }
    // if (auth.user?.cityId == null) { go('/onboarding'); return; }
    // go('/home');

    Navigator.of(context).pushReplacementNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_showFatalError) return _buildFatalError();
    if (_showError) return _buildTimeoutError();
    return _buildSplash();
  }

  Widget _buildSplash() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/paranalogo.png',
              width: 160,
              errorBuilder: (_, __, ___) => const SizedBox(
                width: 160,
                height: 160,
                child: Icon(Icons.image_not_supported, size: 48, color: Color(0xFF006733)),
              ),
            ),
            const SizedBox(height: 32),
            AnimatedOpacity(
              opacity: _showLoading ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 400),
              child: const Text(
                'Carregando...',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeoutError() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/images/paranalogo.png', width: 120),
              const SizedBox(height: 32),
              const Text(
                'Não foi possível iniciar.',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Verifique sua conexão.',
                style: TextStyle(fontSize: 14, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _showError = false;
                      _showLoading = false;
                    });
                    _boot();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF006733),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Tentar novamente'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFatalError() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Color(0xFFE53935)),
              const SizedBox(height: 24),
              const Text(
                'Erro ao iniciar o aplicativo',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                _fatalErrorMessage ?? 'Erro desconhecido',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}