import 'package:flutter/material.dart';
import '../forgot_password_controller.dart';

class Step3NewPassword extends StatelessWidget {
  final ForgotPasswordController controller;

  const Step3NewPassword({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'NOVA SENHA',
            style: TextStyle(
              color: Color(0xFF5F6B64),
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            obscureText: !controller.isPasswordVisible,
            decoration: InputDecoration(
              hintText: 'Mínimo 8 caracteres',
              hintStyle: const TextStyle(
                color: Color(0xFF7C847F),
                fontSize: 18,
              ),
              filled: true,
              fillColor: const Color(0xFFF3F7F3),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 18,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFDDE6DD)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFDDE6DD)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFF006B2D),
                  width: 1.4,
                ),
              ),
              suffixIcon: IconButton(
                onPressed: controller.togglePasswordVisibility,
                icon: Icon(
                  controller.isPasswordVisible
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: const Color(0xFF006B2D),
                ),
              ),
              errorText: controller.weakPasswordError
                  ? 'Senha muito fraca. Tente uma mais forte.'
                  : null,
            ),

            onChanged: (value) => controller.newPassword = value,
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(4, (index) {
              final password = controller.newPassword;

              final int strength = password.isEmpty
                  ? 0
                  : controller.isPasswordValid
                  ? 4
                  : password.length >= 8
                  ? 3
                  : password.length >= 4
                  ? 2
                  : 1;

              Color color;

              if (index >= strength) {
                color = const Color(0xFFE4EAE4);
              } else if (strength <= 1) {
                color = Colors.red;
              } else if (strength <= 3) {
                color = Colors.orange;
              } else {
                color = const Color(0xFF006B2D);
              }

              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index == 3 ? 0 : 6),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              Text(
                _passwordStrengthLabel(controller),
                style: TextStyle(
                  color: _passwordStrengthColor(controller),
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
              const Spacer(),
              const Text(
                'Use letras, números e símbolos',
                style: TextStyle(color: Color(0xFF5F6B64), fontSize: 13),
              ),
            ],
          ),

          const SizedBox(height: 24),

          const Text(
            'CONFIRMAR NOVA SENHA',
            style: TextStyle(
              color: Color(0xFF5F6B64),
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(height: 8),

          TextField(
            obscureText: !controller.isConfirmPasswordVisible,
            decoration: InputDecoration(
              hintText: 'Repita a nova senha',
              hintStyle: const TextStyle(
                color: Color(0xFF7C847F),
                fontSize: 18,
              ),
              filled: true,
              fillColor: const Color(0xFFF3F7F3),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 18,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFDDE6DD)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFDDE6DD)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFF006B2D),
                  width: 1.4,
                ),
              ),
              errorText:
                  !controller.passwordsMatch &&
                      controller.confirmPassword.isNotEmpty
                  ? 'As senhas não coincidem'
                  : null,
              suffixIcon: IconButton(
                onPressed: controller.toggleConfirmPasswordVisibility,
                icon: Icon(
                  controller.isConfirmPasswordVisible
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: const Color(0xFF006B2D),
                ),
              ),
            ),
            onChanged: (value) => controller.confirmPassword = value,
          ),
          const SizedBox(height: 20),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F7F3),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFDDE6DD)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'REQUISITOS',
                  style: TextStyle(
                    color: Color(0xFF5F6B64),
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.8,
                  ),
                ),
                const SizedBox(height: 12),
                _RequirementItem(
                  checked: controller.hasMinLength,
                  text: 'Mínimo 8 caracteres',
                ),
                _RequirementItem(
                  checked: controller.hasUppercase,
                  text: 'Pelo menos uma letra maiúscula',
                ),
                _RequirementItem(
                  checked: controller.hasNumber,
                  text: 'Pelo menos um número',
                ),
                _RequirementItem(
                  checked: controller.hasSymbol,
                  text: 'Pelo menos um símbolo',
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006B2D),
              foregroundColor: Colors.white,
              disabledBackgroundColor: const Color(0xFFEAF3EA),
              disabledForegroundColor: const Color(0xFF006B2D),
              minimumSize: const Size(double.infinity, 58),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed:
                controller.isPasswordValid &&
                    controller.passwordsMatch &&
                    !controller.isLoading
                ? () async {
                    final success = await controller.resetPassword();
                    if (success && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Senha alterada com sucesso!'),
                        ),
                      );
                      Navigator.of(context).pop();
                    }
                  }
                : null,
            child: controller.isLoading
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Redefinir senha'),
          ),
        ],
      ),
    );
  }
}

class _RequirementItem extends StatelessWidget {
  final bool checked;
  final String text;

  const _RequirementItem({required this.checked, required this.text});

  @override
  Widget build(BuildContext context) {
    final Color color = checked
        ? const Color(0xFF238B57)
        : const Color(0xFFE4EAE4);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            checked ? Icons.check_circle : Icons.circle,
            size: 22,
            color: color,
          ),
          const SizedBox(width: 10),
          Text(
            text,
            style: const TextStyle(
              color: Color(0xFF17211B),
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

int _passwordStrength(ForgotPasswordController controller) {
  int strength = 0;

  if (controller.hasMinLength) strength++;
  if (controller.hasUppercase) strength++;
  if (controller.hasNumber) strength++;
  if (controller.hasSymbol) strength++;

  return strength;
}

String _passwordStrengthLabel(ForgotPasswordController controller) {
  final strength = _passwordStrength(controller);

  if (controller.newPassword.isEmpty) return '';
  if (strength <= 1) return 'Senha fraca';
  if (strength <= 3) return 'Senha média';
  return 'Senha forte';
}

Color _passwordStrengthColor(ForgotPasswordController controller) {
  final strength = _passwordStrength(controller);

  if (controller.newPassword.isEmpty) return Colors.transparent;
  if (strength <= 1) return Colors.red;
  if (strength <= 3) return Colors.orange;
  return const Color(0xFF006B2D);
}
