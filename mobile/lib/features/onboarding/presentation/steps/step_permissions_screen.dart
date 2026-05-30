import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:conectaparana/features/onboarding/presentation/widgets/onboarding_step_indicator.dart';

class StepPermissionsScreen extends StatefulWidget {
  final VoidCallback onConclude;

  const StepPermissionsScreen({super.key, required this.onConclude});

  @override
  State<StepPermissionsScreen> createState() => _StepPermissionsScreenState();
}

enum _PermStatus { pending, granted, denied }

class _StepPermissionsScreenState extends State<StepPermissionsScreen> {
  _PermStatus _locationStatus = _PermStatus.pending;
  _PermStatus _notifStatus = _PermStatus.pending;

  Future<void> _requestLocation() async {
    if (_locationStatus == _PermStatus.denied) {
      await openAppSettings();
      return;
    }
    final result = await Permission.locationWhenInUse.request();
    setState(() {
      _locationStatus = result.isGranted
          ? _PermStatus.granted
          : _PermStatus.denied;
    });
  }

  Future<void> _requestNotifications() async {
    if (_notifStatus == _PermStatus.denied) {
      await openAppSettings();
      return;
    }
    final result = await Permission.notification.request();
    setState(() {
      _notifStatus = result.isGranted
          ? _PermStatus.granted
          : _PermStatus.denied;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OnboardingStepIndicator(currentStep: 2),
        const SizedBox(height: 24),
        const Text(
          'ÚLTIMO PASSO!',
          style: TextStyle(
            color: Color(0xFF006733),
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Ative as permissões',
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        const Text(
          'Para entregar a melhor experiência, precisamos de dois acessos. Você pode ajustar depois no Perfil.',
          style: TextStyle(fontSize: 14, color: Colors.black54, height: 1.5),
        ),
        const SizedBox(height: 28),

        _PermissionCard(
          icon: Icons.location_on_outlined,
          title: 'Localização',
          description: 'Usada para alertas e conteúdo relevante na sua região.',
          status: _locationStatus,
          onRequest: _requestLocation,
        ),
        const SizedBox(height: 12),
        _PermissionCard(
          icon: Icons.notifications_outlined,
          title: 'Notificações',
          description:
              'Receba alertas importantes da sua cidade em tempo real.',
          status: _notifStatus,
          onRequest: _requestNotifications,
        ),

        const Spacer(),

        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: widget.onConclude,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006733),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(50),
              ),
            ),
            child: const Text(
              'Concluir',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }
}

class _PermissionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final _PermStatus status;
  final VoidCallback onRequest;

  const _PermissionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.status,
    required this.onRequest,
  });

  @override
  Widget build(BuildContext context) {
    final isGranted = status == _PermStatus.granted;
    final isDenied = status == _PermStatus.denied;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isGranted ? const Color(0xFFF0FAF4) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isGranted ? const Color(0xFF006733) : const Color(0xFFE2E8F0),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isGranted
                      ? const Color(0xFF006733)
                      : const Color(0xFFE8EDE9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isGranted ? Icons.check : icon,
                  size: 20,
                  color: isGranted ? Colors.white : const Color(0xFF006733),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              if (status != _PermStatus.pending)
                Text(
                  isGranted ? '✓ Permitido' : 'Negado',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isGranted ? const Color(0xFF006733) : Colors.black38,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: const TextStyle(
              fontSize: 13,
              color: Colors.black54,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          if (!isGranted)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onRequest,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF006733),
                  side: const BorderSide(color: Color(0xFF006733)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  isDenied ? 'Tentar novamente' : 'Permitir acesso',
                  style: const TextStyle(
                    fontSize: 13,
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
