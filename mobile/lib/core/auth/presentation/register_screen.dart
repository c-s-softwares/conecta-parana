import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:conectaparana/features/register/data/services/register_repository.dart';
<<<<<<< HEAD
import 'package:conectaparana/shared/widgets/pages/webview_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
=======
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:conectaparana/shared/widgets/pages/webview_screen.dart';
>>>>>>> 4ce3d4c (refactor: fix models and services folder structure and update imports)
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:dio/dio.dart';

class _PasswordRules {
  static final _especial = RegExp(
    r'[!@#\$%^&*(),.?":{}|<>_\-+=/\\\[\]~`'
    "'"
    ';]',
  );

  static bool minimo(String senha) => senha.length >= 8;
  static bool maiuscula(String senha) => senha.contains(RegExp(r'[A-Z]'));
  static bool minuscula(String senha) => senha.contains(RegExp(r'[a-z]'));
  static bool numero(String senha) => senha.contains(RegExp(r'[0-9]'));
  static bool especial(String senha) => senha.contains(_especial);

  static int forca(String senha) {
    int count = 0;
    if (minimo(senha)) count++;
    if (maiuscula(senha)) count++;
    if (minuscula(senha)) count++;
    if (numero(senha)) count++;
    if (especial(senha)) count++;
    return count;
  }

  static bool forte(String senha) => forca(senha) == 5;
}

class RegisterScreen extends StatefulWidget {
  final CityService? cityService;
  final RegisterRepository? repository;
  const RegisterScreen({super.key, this.cityService, this.repository});

  @override
  State<RegisterScreen> createState() => RegisterScreenState();
}

class RegisterScreenState extends State<RegisterScreen> {
  late final CityService _cityService;

  @override
  void initState() {
    super.initState();
    _cityService = widget.cityService ?? CityService();
    _loadCities();
  }

  List<City> _cities = [];
  City? _selectedCity;
  bool _loadingCities = true;
  bool _citiesError = false;

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

  String? _nameError;
  String? _emailError;
  String? _passwordError;

  bool _emailExists = false;
  bool _isLoading = false;

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

  Future<void> _loadCities() async {
    setState(() {
      _loadingCities = true;
      _citiesError = false;
    });
    try {
      final cities = await _cityService.getCities();
      setState(() {
        _cities = cities;
        _loadingCities = false;
      });
    } catch (e) {
      setState(() {
        _loadingCities = false;
        _citiesError = true;
      });
    }
  }

  bool _passwordForte() => _PasswordRules.forte(_passwordController.text);

  bool _validate() {
    setState(() {
      _nameError = null;
      _emailError = null;
      _passwordError = null;

      if (_nameController.text.trim().isEmpty) {
        _nameError = 'Informe seu nome';
      }

      final email = _emailController.text.trim();
      if (email.isEmpty || !email.contains('@') || !email.contains('.')) {
        _emailError = 'Informe um email válido';
      }

      if (!_passwordForte()) {
        _passwordError = 'A senha não atende os critérios mínimos';
      }
    });

    final senhasIguais = _passwordController.text == _confirmController.text;
    return _nameError == null &&
        _emailError == null &&
        _passwordError == null &&
        senhasIguais &&
        _acceptedTerms;
  }

  bool get _formValido {
    final email = _emailController.text.trim();
    return _nameController.text.trim().isNotEmpty &&
        email.contains('@') &&
        email.contains('.') &&
        _passwordForte() &&
        _passwordController.text == _confirmController.text &&
        _confirmController.text.isNotEmpty &&
        _acceptedTerms &&
        _selectedCity != null;
  }

  bool get _formEnabled => !_loadingCities && !_citiesError;

  @visibleForTesting
  void validateForTest() => _validate();

  Future<void> _register() async {
    if (!_validate()) return;
    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final tokens = await (widget.repository ?? RegisterRepository()).register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        cityId: _selectedCity!.id,
      );

      await AuthService.instance.login(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );

      if (!mounted) return;

      setState(() => _isLoading = false);
      context.go('/onboarding');
    } on DioException catch (e) {
      if (!mounted) return;

      final data = e.response?.data;
      final code = data is Map ? data['code']?.toString() : null;

      if (e.response?.statusCode == 409 || code == 'email_exists') {
        setState(() {
          _emailExists = true;
          _emailError = 'Este e-mail já está cadastrado.';
          _isLoading = false;
        });
        return;
      }

      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Erro ao criar conta. Verifique sua conexão e tente novamente.',
          ),
        ),
      );
    } catch (_) {
      if (!mounted) return;

      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Erro ao criar conta. Verifique sua conexão e tente novamente.',
          ),
        ),
      );
    }
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
            child: const Icon(Icons.chevron_left, color: Colors.black54),
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
        _buildLabel('NOME COMPLETO'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _nameController,
          enabled: _formEnabled,
          focusNode: _nameFocus,
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) => _emailFocus.requestFocus(),
          onChanged: (_) => setState(() => _nameError = null),
          decoration: _inputDecoration(
            hint: 'Nome Sobrenome',
            icon: Icons.person_outline,
            errorText: _nameError,
          ),
        ),

        const SizedBox(height: 20),

        TextFormField(
          controller: _emailController,
          enabled: _formEnabled,
          focusNode: _emailFocus,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) => _passwordFocus.requestFocus(),
          onChanged: (value) => setState(() {
            _emailExists = false;
            final v = value.trim();
            if (v.isEmpty) {
              _emailError = null;
            } else if (!v.contains('@') || !v.contains('.')) {
              _emailError = 'Informe um email válido';
            } else {
              _emailError = null;
            }
          }),
          decoration: _inputDecoration(
            hint: 'seu@email.com',
            errorText: _emailError,
          ),
        ),

        if (_emailExists) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFEBEE),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 18),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Esse email já tem conta. Faça login.',
                    style: TextStyle(color: Colors.red, fontSize: 13),
                  ),
                ),
                TextButton(
                  key: const Key('go_to_login_button'),
                  onPressed: () =>
                      Navigator.pushReplacementNamed(context, '/login'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: const Size(0, 32),
                  ),
                  child: const Text(
                    'Fazer login',
                    style: TextStyle(
                      color: Color(0xFF006733),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 20),

        _buildLabel('SENHA'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _passwordController,
          enabled: _formEnabled,
          focusNode: _passwordFocus,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.next,
          onFieldSubmitted: (_) => _confirmFocus.requestFocus(),
          onChanged: (value) => setState(() {
            if (value.isEmpty) {
              _passwordError = null;
            } else if (!_passwordForte()) {
              _passwordError =
                  'Mín. 8 caracteres com maiúscula, minúscula, número e especial';
            } else {
              _passwordError = null;
            }
          }),
          decoration: _inputDecoration(
            hint: 'Mínimo 8 caracteres',
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

        const SizedBox(height: 12),

        _buildPasswordStrength(),

        const SizedBox(height: 24),

        _buildLabel('CONFIRMAR SENHA'),
        const SizedBox(height: 8),
        TextFormField(
          controller: _confirmController,
          enabled: _formEnabled,
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

        const SizedBox(height: 20),
        _buildLabel('CIDADE'),

        const SizedBox(height: 8),
        _buildCityDropdown(),

        const SizedBox(height: 24),
        _buildTermsCheckbox(),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            key: const Key('register_submit_button'),
            onPressed: _isLoading || !_formValido ? null : _register,
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
                    'Criar conta',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
          ),
        ),

        const SizedBox(height: 24),

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

        const SizedBox(height: 20),

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

    final forca = _PasswordRules.forca(senha);

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
    } else if (forca == 3) {
      label = 'Senha média';
      labelColor = Colors.orange;
      barColors = [
        Colors.orange,
        Colors.orange,
        Colors.grey.shade300,
        Colors.grey.shade300,
      ];
    } else if (forca == 4) {
      label = 'Quase lá — falta 1 critério';
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
          key: const Key('terms_checkbox'),
          onTap: _formEnabled
              ? () => setState(() => _acceptedTerms = !_acceptedTerms)
              : null,
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
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const WebViewScreen(
                          title: 'Termos de Uso',
                          url: 'https://conectaparana.pr.gov.br/termos',
                        ),
                      ),
                    ),
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
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const WebViewScreen(
                          title: 'Política de Privacidade',
                          url: 'https://conectaparana.pr.gov.br/privacidade',
                        ),
                      ),
                    ),
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

  Widget _buildCityDropdown() {
    if (_loadingCities) {
      return Container(
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFFF5FAF7),
          borderRadius: BorderRadius.circular(50),
        ),
        child: const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Color(0xFF006733),
            ),
          ),
        ),
      );
    }

    if (_citiesError) {
      return Container(
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFFF5FAF7),
          borderRadius: BorderRadius.circular(50),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Erro ao carregar cidades.',
              style: TextStyle(color: Colors.black54),
            ),
            TextButton(
              onPressed: _loadCities,
              child: const Text(
                'Tentar novamente',
                style: TextStyle(
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return DropdownButtonFormField<City>(
      initialValue: _selectedCity,
      hint: const Text(
        'Selecione sua cidade',
        style: TextStyle(color: Colors.black38),
      ),
      decoration: _inputDecoration(hint: ''),
      borderRadius: BorderRadius.circular(16),
      items: _cities.map((city) {
        return DropdownMenuItem<City>(value: city, child: Text(city.name));
      }).toList(),
      onChanged: (city) => setState(() => _selectedCity = city),
    );
  }
}
