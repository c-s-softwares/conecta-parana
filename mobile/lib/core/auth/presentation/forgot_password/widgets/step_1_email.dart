import 'package:flutter/material.dart';
import '../forgot_password_controller.dart';

class Step1Email extends StatelessWidget {
  final ForgotPasswordController controller;

  const Step1Email({super.key, required this.controller});

  static const Color _primaryGreen = Color(0xFF006B2D);
  static const Color _lightGreen = Color(0xFFF3F7F3);
  static const Color _borderColor = Color(0xFFDDE6DD);
  static const Color _textColor = Color(0xFF17211B);
  static const Color _mutedTextColor = Color(0xFF5F6B64);
  static const Color _disabledButton = Color(0xFFE8ECE8);
  static const Color _disabledText = Color(0xFF9AA29A);

  @override
  Widget build(BuildContext context) {
    final bool canSubmit = controller.isEmailValid &&
        !controller.isLoading &&
        controller.resendCooldown == 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _InfoCard(),

          const SizedBox(height: 28),

          const Text(
            'E-MAIL CADASTRADO',
            style: TextStyle(
              color: _mutedTextColor,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.8,
            ),
          ),

          const SizedBox(height: 10),

          TextFormField(
            initialValue: controller.email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            style: const TextStyle(
              color: _textColor,
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
            onChanged: (value) {
              controller.email = value;
            },
            decoration: InputDecoration(
              hintText: 'seu@email.com',
              hintStyle: const TextStyle(
                color: Color(0xFF8B948D),
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
              prefixIcon: const Icon(
                Icons.person_outline_rounded,
                color: _mutedTextColor,
                size: 24,
              ),
              filled: true,
              fillColor: _lightGreen,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 20,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _borderColor, width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _borderColor, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: _primaryGreen, width: 1.4),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Colors.red, width: 1),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Colors.red, width: 1.4),
              ),
              errorText: controller.email.isNotEmpty && !controller.isEmailValid
                  ? 'E-mail malformado'
                  : null,
            ),
          ),

          if (controller.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                controller.errorMessage!,
                style: const TextStyle(
                  color: Colors.red,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),

          const SizedBox(height: 26),

          SizedBox(
            height: 58,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: canSubmit ? _primaryGreen : _disabledButton,
                foregroundColor: canSubmit ? Colors.white : _disabledText,
                disabledBackgroundColor: _disabledButton,
                disabledForegroundColor: _disabledText,
                elevation: 0,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: canSubmit
                  ? () async {
                      final success = await controller.submitEmail();

                      if (success && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Se o email existir, enviamos um código.',
                            ),
                          ),
                        );
                      }
                    }
                  : null,
             child: controller.isLoading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : controller.resendCooldown > 0
                  ? Text(
                      'Aguarde ${controller.resendCooldown}s',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 22,
                        ),
                        SizedBox(width: 10),
                        Text(
                          'Enviar código',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
            ),
          ),

          const SizedBox(height: 28),

          Center(
            child: GestureDetector(
              onTap: () {
                Navigator.of(context).pop();
              },
              child: RichText(
                text: const TextSpan(
                  text: 'Lembrou a senha? ',
                  style: TextStyle(
                    color: _mutedTextColor,
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                  children: [
                    TextSpan(
                      text: 'Voltar ao login',
                      style: TextStyle(
                        color: _primaryGreen,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard();

  static const Color _cardColor = Color(0xFFF3F7F3);
  static const Color _borderColor = Color(0xFFDDE6DD);
  static const Color _textColor = Color(0xFF17211B);
  static const Color _mutedTextColor = Color(0xFF5F6B64);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 24),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _borderColor, width: 1),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Como funciona',
            style: TextStyle(
              color: _textColor,
              fontSize: 17,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos para você redefinir a senha.',
            style: TextStyle(
              color: _mutedTextColor,
              fontSize: 15,
              fontWeight: FontWeight.w400,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
