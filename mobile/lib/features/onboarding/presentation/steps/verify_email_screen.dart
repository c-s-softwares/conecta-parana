import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/features/register/data/services/register_repository.dart';
import 'package:go_router/go_router.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;
  final String password;
  final RegisterRepository? repository;
  final AuthService? authService;

  const VerifyEmailScreen({
    super.key,
    required this.email,
    required this.password,
    this.repository,
    this.authService,
  });

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  late final RegisterRepository _repository;
  late final AuthService _auth;

  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  bool _isVerifying = false;
  String? _error;

  bool _cooldown = false;
  int _secondsLeft = 0;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RegisterRepository();
    _auth = widget.authService ?? AuthService.instance;
    _startCooldown();
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();
  bool get _isComplete => _code.length == 6 && !_code.contains(RegExp(r'\D'));

  void _onChanged(int index, String value) {
    setState(() => _error = null);

    if (value.length > 1) {
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (var i = 0; i < 6; i++) {
        _controllers[i].text = i < digits.length ? digits[i] : '';
      }
      final next = digits.length >= 6 ? 5 : digits.length;
      _focusNodes[next.clamp(0, 5)].requestFocus();
      setState(() {});
      return;
    }

    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    setState(() {});
  }

  void _onBackspace(int index) {
    if (_controllers[index].text.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
      _controllers[index - 1].clear();
      setState(() {});
    }
  }

  Future<void> _verify() async {
    if (!_isComplete || _isVerifying) return;

    setState(() {
      _isVerifying = true;
      _error = null;
    });

    try {
      await _repository.verifyEmail(email: widget.email, code: _code);
      final tokens = await _repository.login(
        email: widget.email,
        password: widget.password,
      );
      await _auth.login(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );

      if (!mounted) return;
      context.go('/onboarding');
    } on DioException {
      if (!mounted) return;
      setState(() {
        _error = 'Código inválido ou expirado. Confira e tente novamente.';
        _isVerifying = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Algo deu errado. Tente novamente.';
        _isVerifying = false;
      });
    }
  }

  Future<void> _resend() async {
    if (_cooldown) return;
    try {
      await _repository.resendVerification(email: widget.email);
      if (!mounted) return;
      _startCooldown();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Novo código enviado para seu email.'),
          backgroundColor: Color(0xFF006733),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Não foi possível reenviar agora. Tente em instantes.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _startCooldown() {
    setState(() {
      _cooldown = true;
      _secondsLeft = 60;
    });
    _tick();
  }

  void _tick() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() => _secondsLeft--);
      if (_secondsLeft <= 0) {
        setState(() => _cooldown = false);
      } else {
        _tick();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
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
              const SizedBox(height: 24),
              const Text(
                'QUASE LÁ!',
                style: TextStyle(
                  color: Color(0xFF006733),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Digite o código',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              Text(
                'Enviamos um código de 6 dígitos para ${widget.email}.',
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'CÓDIGO DE 6 DÍGITOS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                  color: Colors.black45,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (i) => _buildDigitBox(i)),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  key: const Key('verify_code_button'),
                  onPressed: (!_isComplete || _isVerifying) ? null : _verify,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF006733),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.black12,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50),
                    ),
                  ),
                  child: _isVerifying
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Verificar código',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: _cooldown
                    ? Text(
                        'Aguarde ${_secondsLeft}s para reenviar',
                        style: const TextStyle(
                          color: Colors.black45,
                          fontSize: 13,
                        ),
                      )
                    : TextButton(
                        key: const Key('resend_code_button'),
                        onPressed: _resend,
                        child: const Text(
                          'Reenviar código',
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
    );
  }

  Widget _buildDigitBox(int index) {
    final filled = _controllers[index].text.isNotEmpty;
    return SizedBox(
      width: 48,
      height: 56,
      child: KeyboardListener(
        focusNode: FocusNode(skipTraversal: true),
        onKeyEvent: (event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.backspace) {
            _onBackspace(index);
          }
        },
        child: TextField(
          key: Key('code_digit_$index'),
          controller: _controllers[index],
          focusNode: _focusNodes[index],
          autofocus: index == 0,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          maxLength: index == 0 ? 6 : 1,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          decoration: InputDecoration(
            counterText: '',
            filled: true,
            fillColor: filled
                ? const Color(0xFFF0FAF4)
                : const Color(0xFFF5FAF7),
            contentPadding: EdgeInsets.zero,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: filled
                    ? const Color(0xFF006733)
                    : const Color(0xFFE2E8F0),
                width: 1.5,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: Color(0xFF006733),
                width: 1.5,
              ),
            ),
          ),
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (v) => _onChanged(index, v),
        ),
      ),
    );
  }
}
