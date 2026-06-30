import 'dart:async';
import 'package:conectaparana/core/router/navigator_key.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:conectaparana/core/auth/auth_service.dart';

class SplashPage extends StatefulWidget {
  final Future<Map<String, bool>> Function()? mockAuthCheck;
  final void Function(String)? onNavigate;

  const SplashPage({super.key, this.mockAuthCheck, this.onNavigate});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  bool _mostrarCarregando = false;
  bool _erroCritico = false;
  bool _erroFatal = false;
  String _logErro = '';
  Timer? _timerCarregando;
  Timer? _timerTimeout;

  @override
  void initState() {
    super.initState();
    _inicializarAplicativo();
  }

  @override
  void dispose() {
    _timerCarregando?.cancel();
    _timerTimeout?.cancel();
    super.dispose();
  }

  Future<void> _inicializarAplicativo() async {
    setState(() {
      _mostrarCarregando = false;
      _erroCritico = false;
      _erroFatal = false;
      _logErro = '';
    });

    _timerCarregando = Timer(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() => _mostrarCarregando = true);
      }
    });

    _timerTimeout = Timer(const Duration(seconds: 30), () {
      if (mounted) {
        setState(() {
          _mostrarCarregando = false;
          _erroCritico = true;
        });
      }
    });

    try {
      await Future.delayed(const Duration(milliseconds: 800));

      Map<String, bool> authData = {'isLogged': false, 'hasCity': false};

      if (widget.mockAuthCheck != null) {
        authData = await widget.mockAuthCheck!();
      } else {
        final user = AuthService.instance.currentUser.value;
        final cityId = user?.cityId.trim();

        authData = {
          'isLogged': user != null,
          'hasCity': cityId != null && cityId.isNotEmpty && cityId != 'null',
        };
      }

      _timerCarregando?.cancel();
      _timerTimeout?.cancel();

      if (authData['isLogged'] == true && authData['hasCity'] == true) {
        _executarNavegacao('/home');
      } else if (authData['isLogged'] == true && authData['hasCity'] == false) {
        _executarNavegacao('/onboarding');
      } else {
        _executarNavegacao('/login');
      }
    } catch (e, stackTrace) {
      _timerCarregando?.cancel();
      _timerTimeout?.cancel();
      if (mounted) {
        setState(() {
          _erroFatal = true;
          _logErro = '$e\n$stackTrace';
        });
      }
    }
  }

  void _executarNavegacao(String rota) {
    if (widget.onNavigate != null) {
      widget.onNavigate!(rota);
    } else {
      // ignore: use_build_context_synchronously
      navigatorKey.currentContext?.go(rota);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/paranalogo.png',
              width: 150,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.image_not_supported,
                  size: 50,
                  color: Colors.grey,
                );
              },
            ),
            if (_erroFatal) ...[
              const SizedBox(height: 24),
              const Icon(
                Icons.bug_report_rounded,
                color: Colors.orange,
                size: 48,
              ),
              const SizedBox(height: 16),
              const Text(
                'Ocorreu um erro inesperado ao inicializar o aplicativo.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _logErro.split('\n').first,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.redAccent, fontSize: 12),
              ),
            ] else if (_erroCritico) ...[
              const SizedBox(height: 24),
              const Icon(Icons.wifi_off_rounded, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              const Text(
                'Não foi possível conectar ao servidor.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Verifique sua conexão com a internet e tente novamente.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _inicializarAplicativo,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Tentar Novamente'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF006733),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ] else if (_mostrarCarregando) ...[
              const SizedBox(height: 24),
              const Text(
                'Carregando informações...',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
              const SizedBox(height: 16),
              const CircularProgressIndicator(color: Color(0xFF006733)),
            ],
          ],
        ),
      ),
    );
  }
}
