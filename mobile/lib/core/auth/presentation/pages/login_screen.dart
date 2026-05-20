import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../../core/auth/auth_service.dart';
import '../../../../dev/fakes/fake_jwt.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {

  final _emailController    = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus         = FocusNode();
  final _passwordFocus      = FocusNode();

  final _formKey       = GlobalKey<FormState>();
  String? _emailError;
  String? _passwordError;

  bool _obscurePassword     = true;

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
    _emailError   = null;
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

    final fakeAccessToken  = generateFakeJwt();
    final fakeRefreshToken = generateFakeJwt();

    await AuthService.instance.login(
      accessToken:  fakeAccessToken,
      refreshToken: fakeRefreshToken,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: AutofillGroup(
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildHero(),
              _buildForm(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Container(
      width: double.infinity,
      color: const Color(0xFF006733),
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
                errorBuilder: (context, e, s) => const SizedBox(width: 32),
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
            controller:       _emailController,
            focusNode:        _emailFocus,
            keyboardType:     TextInputType.emailAddress,
            textInputAction:  TextInputAction.next,
            autofillHints:    const [AutofillHints.username],
            onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
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
            controller:       _passwordController,
            focusNode:        _passwordFocus,
            obscureText:      _obscurePassword,
            autofillHints:    const [AutofillHints.password],
            textInputAction:  TextInputAction.done,
            onFieldSubmitted: (_) => _login(),
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
              onPressed: _login,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006733),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: const Text(
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
                onTap: () {}, 
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
      hintText:   hint,
      errorText: errorText,
      hintStyle:  const TextStyle(color: Colors.black38),
      prefixIcon: icon != null
          ? Icon(icon, color: Colors.black38, size: 20)
          : null,
      suffixIcon:     suffix,
      filled:         true,
      fillColor:      const Color(0xFFF5FAF7),
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