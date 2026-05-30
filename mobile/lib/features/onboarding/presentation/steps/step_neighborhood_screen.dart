import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/widgets/onboarding_step_indicator.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';

class StepNeighborhoodScreen extends StatefulWidget {
  final OnboardingRepository repository;
  final String cityName;
  final VoidCallback onNext;

  const StepNeighborhoodScreen({
    super.key,
    required this.repository,
    required this.cityName,
    required this.onNext,
  });

  @override
  State<StepNeighborhoodScreen> createState() => _StepNeighborhoodScreenState();
}

class _StepNeighborhoodScreenState extends State<StepNeighborhoodScreen> {
  final _controller = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleNext() async {
    final neighborhood = _controller.text.trim();
    if (neighborhood.isEmpty) {
      widget.onNext();
      return;
    }

    setState(() => _isLoading = true);

    try {
      await widget.repository.updateNeighborhood(neighborhood);
      if (!mounted) return;
      widget.onNext();
    } on DioException {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Não foi possível salvar. Tente novamente ou pule.',
        variant: AppToastVariant.error,
      );
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OnboardingStepIndicator(currentStep: 1),
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
          'Qual é o seu bairro?',
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        const Text(
          'Assim podemos personalizar ainda mais os alertas perto de você.',
          style: TextStyle(fontSize: 14, color: Colors.black54, height: 1.5),
        ),
        const SizedBox(height: 24),

        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FAF4),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF006733)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.location_on_outlined,
                size: 14,
                color: Color(0xFF006733),
              ),
              const SizedBox(width: 6),
              Text(
                '${widget.cityName}, PR',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0D5C35),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        const Text(
          'BAIRRO',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _controller,
          maxLength: 80,
          onChanged: (_) => setState(() {}),
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: 'Ex: Centro, Jardim, Vila...',
            hintStyle: const TextStyle(color: Colors.black38),
            counterText: '',
            filled: true,
            fillColor: const Color(0xFFF5FAF7),
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(
                      Icons.clear,
                      size: 18,
                      color: Colors.black38,
                    ),
                    onPressed: () => setState(() => _controller.clear()),
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: Color(0xFF006733),
                width: 1.5,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Opcional — você pode preencher depois no Perfil.',
          style: TextStyle(fontSize: 12, color: Colors.black38, height: 1.4),
        ),

        const Spacer(),

        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: widget.onNext,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFC8DDC1)),
                  foregroundColor: const Color(0xFF006733),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(50),
                  ),
                ),
                child: const Text(
                  'Pular',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleNext,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF006733),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
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
                        'Próximo',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
