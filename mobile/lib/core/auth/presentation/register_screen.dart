import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  final _nameFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _confirmFocus = FocusNode();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _acceptedTerms = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _nameFocus.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _confirmFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 32),
              _buildForm(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFF5FAF7),
              borderRadius: BorderRadius.circular(50),
            ),
            child: const Icon(Icons.chevron_right, color: Colors.black54),
          ),
        ),
        const SizedBox(width: 12),
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'BEM-VINDO(A)',
              style: TextStyle(
                color: Color(0xFF006733),
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
              ),
            ),
            Text(
              'Criar conta',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Nome
        _buildLabel('NOME COMPLETO'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _nameController,
          focusNode: _nameFocus,
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) => _emailFocus.requestFocus(),
          decoration: _inputDecoration(
            hint: 'Camila Souza',
            icon: Icons.person_outline,
          ),
        ),

        const SizedBox(height: 20),

        // Email
        _buildLabel('E-MAIL'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _emailController,
          focusNode: _emailFocus,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
          decoration: _inputDecoration(hint: 'seu@email.com'),
        ),

        const SizedBox(height: 20),

        // Senha
        _buildLabel('SENHA'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _passwordController,
          focusNode: _passwordFocus,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) => _confirmFocus.requestFocus(),
          onChanged: (_) => setState(() {}),
          decoration: _inputDecoration(
            hint: 'Mínimo 8 caracteres',
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

        const SizedBox(height: 12),
        _buildPasswordStrength(),

        const SizedBox(height: 20),

        // Confirmar senha
        _buildLabel('CONFIRMAR SENHA'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _confirmController,
          focusNode: _confirmFocus,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          onChanged: (_) => setState(() {}),
          decoration: _inputDecoration(
            hint: 'Repita a senha',
            errorText:
                _confirmController.text.isNotEmpty &&
                    _confirmController.text != _passwordController.text
                ? 'As senhas não coincidem'
                : null,
            suffix: TextButton(
              onPressed: () =>
                  setState(() => _obscureConfirm = !_obscureConfirm),
              child: Text(
                _obscureConfirm ? 'Mostrar' : 'Ocultar',
                style: const TextStyle(
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Aceite de termos
        _buildTermsCheckbox(),

        const SizedBox(height: 24),

        // Divisor "ou"
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

        // Botão Google
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
                  'Cadastrar com Google',
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

        const SizedBox(height: 16),

        // Botão Criar conta
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006733),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(50),
              ),
            ),
            child: const Text(
              'Criar conta',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Já tem conta?
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Já tem conta? '),
            GestureDetector(
              onTap: () => Navigator.pushReplacementNamed(context, '/login'),
              child: const Text(
                'Entrar',
                style: TextStyle(
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _buildPasswordStrength() {
    final senha = _passwordController.text;

    if (senha.isEmpty) return const SizedBox();

    final temMinimo = senha.length >= 8;
    final temMaiuscula = senha.contains(RegExp(r'[A-Z]'));
    final temMinuscula = senha.contains(RegExp(r'[a-z]'));
    final temNumero = senha.contains(RegExp(r'[0-9]'));
    final temEspecial = senha.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'));

    int forca = 0;
    if (temMinimo) forca++;
    if (temMaiuscula) forca++;
    if (temMinuscula) forca++;
    if (temNumero) forca++;
    if (temEspecial) forca++;

    String label;
    Color labelColor;
    List<Color> barColors;

    if (forca <= 2) {
      label = 'Senha fraca';
      labelColor = Colors.red;
      barColors = [
        Colors.red,
        Colors.grey.shade300,
        Colors.grey.shade300,
        Colors.grey.shade300,
      ];
    } else if (forca <= 3) {
      label = 'Senha média';
      labelColor = Colors.orange;
      barColors = [
        Colors.orange,
        Colors.orange,
        Colors.grey.shade300,
        Colors.grey.shade300,
      ];
    } else if (forca == 4) {
      label = 'Senha boa';
      labelColor = Colors.lightGreen;
      barColors = [
        Colors.lightGreen,
        Colors.lightGreen,
        Colors.lightGreen,
        Colors.grey.shade300,
      ];
    } else {
      label = 'Senha forte';
      labelColor = const Color(0xFF006733);
      barColors = [
        const Color(0xFF006733),
        const Color(0xFF2E7D32),
        const Color(0xFF81C784),
        const Color(0xFFA5D6A7),
      ];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                height: 4,
                decoration: BoxDecoration(
                  color: barColors[i],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            color: labelColor,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildTermsCheckbox() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => setState(() => _acceptedTerms = !_acceptedTerms),
          child: Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: _acceptedTerms
                  ? const Color(0xFF006733)
                  : Colors.transparent,
              border: Border.all(
                color: _acceptedTerms
                    ? const Color(0xFF006733)
                    : Colors.grey.shade400,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(4),
            ),
            child: _acceptedTerms
                ? const Icon(Icons.check, color: Colors.white, size: 14)
                : null,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: const TextStyle(color: Colors.black87, fontSize: 14),
              children: [
                const TextSpan(text: 'Li e aceito os '),
                WidgetSpan(
                  child: GestureDetector(
                    onTap: () {}, // WebView /termos
                    child: const Text(
                      'Termos de Uso',
                      style: TextStyle(
                        color: Color(0xFF006733),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const TextSpan(text: ' e a '),
                WidgetSpan(
                  child: GestureDetector(
                    onTap: () {}, // WebView /privacidade
                    child: const Text(
                      'Política de Privacidade',
                      style: TextStyle(
                        color: Color(0xFF006733),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
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
