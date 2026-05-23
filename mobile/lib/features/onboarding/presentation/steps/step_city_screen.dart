import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/onboarding/data/models/onboarding_city_model.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/widgets/onboarding_step_indicator.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';

const _kCities = [
  OnboardingCity(id: 'curitiba', name: 'Curitiba', population: '1,77M hab.'),
  OnboardingCity(id: 'londrina', name: 'Londrina', population: '580k hab.'),
  OnboardingCity(id: 'maringa', name: 'Maringá', population: '430k hab.'),
  OnboardingCity(id: 'cascavel', name: 'Cascavel', population: '335k hab.'),
  OnboardingCity(
    id: 'ponta-grossa',
    name: 'Ponta Grossa',
    population: '355k hab.',
  ),
  OnboardingCity(
    id: 'foz-do-iguacu',
    name: 'Foz do Iguaçu',
    population: '258k hab.',
  ),
  OnboardingCity(id: 'paranagua', name: 'Paranaguá', population: '153k hab.'),
];

class StepCityScreen extends StatefulWidget {
  final OnboardingRepository repository;
  final String? preselectedCityId;
  final VoidCallback onNext;

  const StepCityScreen({
    super.key,
    required this.repository,
    required this.onNext,
    this.preselectedCityId,
  });

  @override
  State<StepCityScreen> createState() => _StepCityScreenState();
}

class _StepCityScreenState extends State<StepCityScreen> {
  OnboardingCity? _selected;
  String _query = '';
  bool _isLoading = false;
  bool _cooldown = false;

  @override
  void initState() {
    super.initState();
    if (widget.preselectedCityId != null) {
      _selected = _kCities
          .where((c) => c.id == widget.preselectedCityId)
          .firstOrNull;
    }
  }

  List<OnboardingCity> get _filtered => _kCities
      .where((c) => c.name.toLowerCase().contains(_query.toLowerCase()))
      .toList();

  Future<void> _handleNext() async {
    if (_selected == null || _isLoading || _cooldown) return;

    setState(() => _isLoading = true);

    try {
      await widget.repository.updateCity(_selected!.id);
      if (!mounted) return;
      widget.onNext();
    } on DioException catch (e) {
      if (!mounted) return;

      if (e.response?.statusCode == 429) {
        AppToast.show(
          context,
          message: 'Aguarde alguns segundos para mudar de cidade.',
          variant: AppToastVariant.warning,
        );
        setState(() {
          _isLoading = false;
          _cooldown = true;
        });
        Future.delayed(const Duration(seconds: 60), () {
          if (mounted) setState(() => _cooldown = false);
        });
      } else {
        AppToast.show(
          context,
          message: 'Erro ao salvar cidade. Tente novamente.',
          variant: AppToastVariant.error,
        );
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OnboardingStepIndicator(currentStep: 0),
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
          'Qual é a sua cidade?',
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        const Text(
          'Personalizamos o conteúdo e os alertas da sua cidade no Paraná.',
          style: TextStyle(fontSize: 14, color: Colors.black54, height: 1.5),
        ),
        const SizedBox(height: 20),

        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF5FAF7),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TextField(
            onChanged: (v) => setState(() => _query = v),
            decoration: const InputDecoration(
              hintText: 'Buscar cidade...',
              hintStyle: TextStyle(color: Colors.black38),
              prefixIcon: Icon(Icons.search, color: Colors.black38, size: 20),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        const SizedBox(height: 20),

        const Text(
          'CIDADES DISPONÍVEIS',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
            color: Colors.black45,
          ),
        ),
        const SizedBox(height: 10),

        Expanded(
          child: ListView.separated(
            itemCount: _filtered.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final city = _filtered[index];
              final isSelected = _selected?.id == city.id;

              return GestureDetector(
                onTap: () => setState(() => _selected = city),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFF0FAF4) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF006733)
                          : const Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF006733)
                              : const Color(0xFFE8EDE9),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.location_on_outlined,
                          size: 18,
                          color: isSelected
                              ? Colors.white
                              : const Color(0xFF006733),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              city.name,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              'Paraná · ${city.population}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.black45,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isSelected)
                        Container(
                          width: 24,
                          height: 24,
                          decoration: const BoxDecoration(
                            color: Color(0xFF006733),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: (_selected == null || _isLoading || _cooldown)
                ? null
                : _handleNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006733),
              foregroundColor: Colors.white,
              disabledBackgroundColor: Colors.black12,
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
                : Text(
                    _cooldown ? 'Aguarde...' : 'Próximo',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
