import 'package:flutter/material.dart';
import 'forgot_password_controller.dart';
import 'widgets/step_1_email.dart';
import 'widgets/step_2_code.dart';
import 'widgets/step_3_new_password.dart';

class ForgotPasswordPage extends StatefulWidget {
  final ForgotPasswordController? controller;

  const ForgotPasswordPage({super.key, this.controller});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  late final ForgotPasswordController _controller =
      widget.controller ?? ForgotPasswordController();

  static const Color _backgroundColor = Color(0xFFFAFCFA);

  final List<String> _titles = const [
    'Recuperar senha',
    'Digite o código',
    'Nova senha',
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleBack() {
    if (_controller.currentStep > 0) {
      _controller.previousStep();
      return;
    }

    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: _backgroundColor,
          body: SafeArea(
            child: Column(
              children: [
                _ForgotPasswordHeader(
                  currentStep: _controller.currentStep,
                  title: _titles[_controller.currentStep],
                  onBack: _handleBack,
                ),
                Expanded(
                  child: PageView(
                    controller: _controller.pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      Step1Email(controller: _controller),
                      Step2Code(controller: _controller),
                      Step3NewPassword(controller: _controller),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ForgotPasswordHeader extends StatelessWidget {
  final int currentStep;
  final String title;
  final VoidCallback onBack;

  const _ForgotPasswordHeader({
    required this.currentStep,
    required this.title,
    required this.onBack,
  });

  static const Color _primaryGreen = Color(0xFF006B2D);
  static const Color _inactiveLine = Color(0xFFE3E8E3);
  static const Color _backButtonColor = Color(0xFFF0F2F0);
  static const Color _textColor = Color(0xFF17211B);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Material(
                color: _backButtonColor,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: onBack,
                  customBorder: const CircleBorder(),
                  child: const SizedBox(
                    width: 48,
                    height: 48,
                    child: Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 18,
                      color: _textColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PASSO ${currentStep + 1} DE 3',
                      style: const TextStyle(
                        color: _primaryGreen,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2,
                        height: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _textColor,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        height: 1.05,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: List.generate(3, (index) {
              final bool isActive = index <= currentStep;

              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index == 2 ? 0 : 6),
                  decoration: BoxDecoration(
                    color: isActive ? _primaryGreen : _inactiveLine,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
