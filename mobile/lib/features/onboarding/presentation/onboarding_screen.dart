import 'package:flutter/material.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:conectaparana/features/onboarding/data/services/onboarding_repository.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/step_city_screen.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/step_neighborhood_screen.dart';
import 'package:conectaparana/features/onboarding/presentation/steps/step_permissions_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final OnboardingRepository? repository;
  final CityService? cityService;
  final String? preselectedCityId;

  const OnboardingScreen({
    super.key,
    this.repository,
    this.cityService,
    this.preselectedCityId,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  late final OnboardingRepository _repository;
  late final CityService _cityService;

  int _step = 0;
  City? _selectedCity;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? OnboardingRepository();
    _cityService = widget.cityService ?? CityService();
  }

  void _goToNeighborhood(City city) {
    setState(() {
      _selectedCity = city;
      _step = 1;
    });
  }

  void _goToPermissions() => setState(() => _step = 2);

  void _conclude() => Navigator.pushReplacementNamed(context, '/home');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.05, 0),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: switch (_step) {
              0 => StepCityScreen(
                key: const ValueKey('step_city'),
                repository: _repository,
                cityService: _cityService,
                preselectedCityId: widget.preselectedCityId,
                onNext: _goToNeighborhood,
              ),
              1 => StepNeighborhoodScreen(
                key: const ValueKey('step_neighborhood'),
                repository: _repository,
                cityName: _selectedCity?.name ?? '',
                onNext: _goToPermissions,
              ),
              _ => StepPermissionsScreen(
                key: const ValueKey('step_permissions'),
                onConclude: _conclude,
              ),
            },
          ),
        ),
      ),
    );
  }
}