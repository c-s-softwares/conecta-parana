import 'package:conectaparana/core/router/app_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/auth/auth_service.dart';
import '../../../../dev/fakes/fake_jwt.dart';

class LoginScreen extends StatefulWidget {
  final Future<void> Function(String email, String senha)? mockLogin;

  const LoginScreen({super.key, this.mockLogin});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  String? _emailError;
  String? _passwordError;

  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _emailError = null;
      _passwordError = null;

      final email = _emailController.text.trim();
      final senha = _passwordController.text;

      if (email.isEmpty || !email.contains('@') || !email.contains('.')) {
        _emailError = 'Informe um email válido';
      }

      if (senha.isEmpty) {
        _passwordError = 'Informe a senha';
      }
    });

    return _emailError == null && _passwordError == null;
  }

  Future<void> _login() async {
    if (!_validate()) return;
    if (_isLoading) return;

    setState(() => _isLoading = true);
    try {
      if (widget.mockLogin != null) {
        await widget.mockLogin!(
          _emailController.text.trim(),
          _passwordController.text,
        );
      } else {
        final fakeAccessToken = generateFakeJwt();
        final fakeRefreshToken = generateFakeJwt();

        await AuthService.instance.login(
          accessToken: fakeAccessToken,
          refreshToken: fakeRefreshToken,
        );
      }

      if (mounted) {
        final pending = AppRouter.instance.consumePendingDeepLink();
        context.go(pending ?? AppRoutes.home);
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        _passwordController.clear();
        _passwordFocus.requestFocus();
        _showSnackbar('Email ou senha inválidos.');
      } else {
        _showSnackbar('Sem conexão. Tente novamente.');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF006733),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: AutofillGroup(
        child: SingleChildScrollView(
          child: Column(children: [_buildHero(), _buildForm()]),
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Container(
      width: double.infinity,
      color: const Color(0xFF00122E),
      child: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [Color.fromARGB(255, 7, 47, 111), Color(0xFF003D1A)],
                ),
              ),
            ),
          ),

          Positioned(
            left: -80,
            top: -80,
            child: Container(
              width: 380,
              height: 380,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    Color(0xFF00E676).withOpacity(0.55),
                    Color(0xFF00C853).withOpacity(0.2),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.35, 1.0],
                  radius: 0.65,
                ),
              ),
            ),
          ),

          Padding(
            padding: EdgeInsets.fromLTRB(
              24,
              MediaQuery.of(context).padding.top + 24,
              24,
              40,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Image.asset(
                      'assets/images/paranalogo.png',
                      width: 32,
                      errorBuilder: (context, e, s) =>
                          const SizedBox(width: 32),
                    ),
                    const SizedBox(width: 8),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CONECTA',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'Paraná',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                const Text(
                  'A sua cidade\nno seu bolso.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Acesse comunicados, serviços e alertas da sua cidade.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'E-MAIL',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            focusNode: _emailFocus,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.username],
            onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
            onChanged: (_) => setState(() => _emailError = null),
            decoration: _inputDecoration(
              hint: 'seu@email.com',
              icon: Icons.person_outline,
              errorText: _emailError,
            ),
          ),

          const SizedBox(height: 20),
          const Text(
            'SENHA',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
            focusNode: _passwordFocus,
            obscureText: _obscurePassword,
            autofillHints: const [AutofillHints.password],
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _login(),
            onChanged: (_) => setState(() => _passwordError = null),
            decoration: _inputDecoration(
              hint: '••••••••',
              errorText: _passwordError,
              suffix: TextButton(
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
                child: Text(
                  _obscurePassword ? 'Mostrar' : 'Ocultar',
                  style: const TextStyle(
                    color: Color(0xFF006733),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed:
                  _isLoading || _emailError != null || _passwordError != null
                  ? null
                  : _login,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006733),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Text(
                      'Entrar',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {},
              child: const Text(
                'Esqueceu a senha?',
                style: TextStyle(
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),
          const Row(
            children: [
              Expanded(child: Divider()),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('ou', style: TextStyle(color: Colors.black38)),
              ),
              Expanded(child: Divider()),
            ],
          ),

          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFDDDDDD)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'assets/images/googlelogo.svg',
                    width: 20,
                    height: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Continuar com Google',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Não tem conta? '),
              GestureDetector(
                onTap: () {
                  context.push(AppRoutes.register);
                },
                child: const Text(
                  'Criar conta',
                  style: TextStyle(
                    color: Color(0xFF006733),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),
          Center(
            child: GestureDetector(
              onTap: () {},
              child: const Text(
                'Ou acesse sem conta',
                style: TextStyle(
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w600,
                  decoration: TextDecoration.none,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    IconData? icon,
    Widget? suffix,
    String? errorText,
  }) {
    return InputDecoration(
      hintText: hint,
      errorText: errorText,
      hintStyle: const TextStyle(color: Colors.black38),
      prefixIcon: icon != null
          ? Icon(icon, color: Colors.black38, size: 20)
          : null,
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFFF5FAF7),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(50),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(50),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(50),
        borderSide: const BorderSide(color: Color(0xFF006733), width: 1.5),
      ),
    );
  }
}
