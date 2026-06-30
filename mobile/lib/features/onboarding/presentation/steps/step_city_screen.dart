import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/widgets/onboarding_step_indicator.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';

class StepCityScreen extends StatefulWidget {
  final OnboardingRepository repository;
  final CityService cityService;
  final String? preselectedCityId;
  final void Function(City city) onNext;

  const StepCityScreen({
    super.key,
    required this.repository,
    required this.cityService,
    required this.onNext,
    this.preselectedCityId,
  });

  @override
  State<StepCityScreen> createState() => _StepCityScreenState();
}

class _StepCityScreenState extends State<StepCityScreen> {
  List<City> _cities = [];
  City? _selected;
  String _query = '';

  bool _loadingCities = true;
  bool _citiesError = false;

  bool _isSaving = false;
  bool _cooldown = false;

  @override
  void initState() {
    super.initState();
    _loadCities();
  }

  Future<void> _loadCities() async {
    setState(() {
      _loadingCities = true;
      _citiesError = false;
    });
    try {
      final cities = await widget.cityService.getCities();
      if (!mounted) return;
      setState(() {
        _cities = cities;
        _loadingCities = false;
        if (widget.preselectedCityId != null) {
          _selected = cities
              .where((c) => c.id == widget.preselectedCityId)
              .firstOrNull;
        }
      });
    } catch (e, s) {
      debugPrint('ERRO getCities: $e');
      debugPrint('STACK: $s');
      if (!mounted) return;
      setState(() {
        _loadingCities = false;
        _citiesError = true;
      });
    }
  }

  List<City> get _filtered => _cities
      .where((c) => c.name.toLowerCase().contains(_query.toLowerCase()))
      .toList();

  Future<void> _handleNext() async {
    if (_selected == null || _isSaving || _cooldown) return;

    setState(() => _isSaving = true);
    try {
      await widget.repository.updateCity(_selected!.id);
      if (!mounted) return;
      widget.onNext(_selected!);
    } on DioException catch (e) {
      if (!mounted) return;
      if (e.response?.statusCode == 429) {
        AppToast.show(
          context,
          message: 'Aguarde alguns segundos para mudar de cidade.',
          variant: AppToastVariant.warning,
        );
        setState(() {
          _isSaving = false;
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
        setState(() => _isSaving = false);
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
            enabled: !_loadingCities && !_citiesError,
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
        Expanded(child: _buildCityList()),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            key: const Key('city_next_button'),
            onPressed: (_selected == null || _isSaving || _cooldown)
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
            child: _isSaving
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

  Widget _buildCityList() {
    if (_loadingCities) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF006733)),
      );
    }

    if (_citiesError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Erro ao carregar cidades.',
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 8),
            TextButton(
              key: const Key('retry_cities_button'),
              onPressed: _loadCities,
              child: const Text(
                'Tentar novamente',
                style: TextStyle(
                  color: Color(0xFF006733),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      itemCount: _filtered.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final city = _filtered[index];
        final isSelected = _selected?.id == city.id;
        return GestureDetector(
          onTap: () => setState(() => _selected = city),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
                    color: isSelected ? Colors.white : const Color(0xFF006733),
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
                        city.state,
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
    );
  }
}