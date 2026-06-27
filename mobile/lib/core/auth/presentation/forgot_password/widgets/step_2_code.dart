import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../forgot_password_controller.dart';

class Step2Code extends StatefulWidget {
  final ForgotPasswordController controller;
  const Step2Code({super.key, required this.controller});

  @override
  State<Step2Code> createState() => _Step2CodeState();
}

class _Step2CodeState extends State<Step2Code> {
  static const Color _primaryGreen = Color(0xFF006B2D);
  static const Color _lightGreen = Color(0xFFF3F7F3);
  static const Color _borderColor = Color(0xFFDDE6DD);
  static const Color _textColor = Color(0xFF17211B);
  static const Color _mutedTextColor = Color(0xFF5F6B64);
  static const Color _disabledButton = Color(0xFFE8ECE8);
  static const Color _disabledText = Color(0xFF9AA29A);

  final List<TextEditingController> _controllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  late final List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _focusNodes = List.generate(6, (i) {
      return FocusNode(
        onKeyEvent: (node, event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.backspace &&
              _controllers[i].text.isEmpty &&
              i > 0) {
            _controllers[i - 1].clear();
            _focusNodes[i - 1].requestFocus();
            _syncCode();
            return KeyEventResult.handled;
          }
          return KeyEventResult.ignored;
        },
      );
    });
  }

  @override
  void dispose() {
    for (var node in _focusNodes) {
      node.dispose();
    }
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onChanged(String value, int index) {
    if (value.length > 1) {
      final digits = value.replaceAll(RegExp(r'\D'), '').split('');
      for (int i = 0; i < 6; i++) {
        _controllers[i].text = i < digits.length ? digits[i] : '';
      }
      final next = digits.length.clamp(0, 5);
      _focusNodes[next].requestFocus();
      _syncCode();
      return;
    }

    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    _syncCode();
  }

  void _syncCode() {
    widget.controller.code = _controllers.map((c) => c.text).join();
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;
    final bool canVerify = controller.code.length == 6 && !controller.isLoading;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 12),
          const Icon(
            Icons.mark_email_read_outlined,
            size: 64,
            color: _primaryGreen,
          ),
          const SizedBox(height: 20),
          const Text(
            'Enviamos um código para',
            textAlign: TextAlign.center,
            style: TextStyle(color: _mutedTextColor, fontSize: 15),
          ),
          const SizedBox(height: 4),
          Text(
            controller.email,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _textColor,
              fontSize: 17,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'CÓDIGO DE 6 DÍGITOS',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _mutedTextColor,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(6, (index) {
              return SizedBox(
                width: 48,
                height: 58,
                child: TextField(
                  controller: _controllers[index],
                  focusNode: _focusNodes[index],
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(
                    color: _textColor,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    filled: true,
                    fillColor: _lightGreen,
                    contentPadding: EdgeInsets.zero,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: _borderColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: _borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(
                        color: _primaryGreen,
                        width: 1.4,
                      ),
                    ),
                  ),
                  onChanged: (val) => _onChanged(val, index),
                ),
              );
            }),
          ),
          if (controller.errorMessage != null) ...[
            const SizedBox(height: 16),
            Text(
              controller.errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.red,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
          const SizedBox(height: 28),
          SizedBox(
            height: 58,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: canVerify ? _primaryGreen : _disabledButton,
                foregroundColor: canVerify ? Colors.white : _disabledText,
                disabledBackgroundColor: _disabledButton,
                disabledForegroundColor: _disabledText,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: canVerify ? () => controller.verifyCode() : null,
              child: controller.isLoading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.arrow_forward_rounded, size: 22),
                        SizedBox(width: 10),
                        Text(
                          'Verificar código',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: TextButton(
              onPressed: controller.resendCooldown > 0
                  ? null
                  : () async {
                      await controller.resendCode();
                    },
              child: Text(
                controller.resendCooldown > 0
                    ? 'Aguarde ${controller.resendCooldown}s para reenviar'
                    : 'Não recebeu? Reenviar código',
                style: const TextStyle(
                  color: _primaryGreen,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}