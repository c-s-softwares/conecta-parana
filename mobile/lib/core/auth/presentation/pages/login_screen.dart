import 'package:conectaparana/core/router/app_router.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/auth/auth_service.dart';

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
        final response = await ApiClient.instance.dio
            .post<Map<String, dynamic>>(
              '/auth/login',
              data: {
                'email': _emailController.text.trim(),
                'password': _passwordController.text,
              },
            );

        final data = response.data ?? const {};
        final accessToken = data['access_token'] ?? data['accessToken'];
        final refreshToken = data['refresh_token'] ?? data['refreshToken'];

        if (accessToken is! String || refreshToken is! String) {
          throw DioException(
            requestOptions: response.requestOptions,
            response: response,
            type: DioExceptionType.badResponse,
          );
        }

        await AuthService.instance.login(
          accessToken: accessToken,
          refreshToken: refreshToken,
        );
      }

      if (mounted) {
        final pending = AppRouter.instance.consumePendingDeepLink();
        context.go(pending ?? AppRoutes.home);
      }
    } on DioException catch (e) {
      final code = e.response?.data is Map<String, dynamic>
          ? (e.response?.data as Map<String, dynamic>)['code'] as String?
          : null;

      if (code == 'email_not_verified') {
        _showError('Confirme seu email antes de entrar.');
      } else if (e.response?.statusCode == 401) {
        _passwordController.clear();
        _passwordFocus.requestFocus();
        _showError('E-mail ou senha inválidos.');
      } else {
        _showError('Sem conexão. Tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    AppToast.show(context, message: message, variant: AppToastVariant.error);
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
                gradient: RadialGradient(
                  center: Alignment.center,
                  colors: [
                    Color(0xFF1B6B3A), // verde escuro médio no centro
                    Color(0xFF0D3D20), // verde bem escuro nas bordas
                  ],
                  radius: 1.2,
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
              onPressed: () {
                context.push(AppRoutes.forgotPassword);
              },
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
                onTap: () => context.push(AppRoutes.register),
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
