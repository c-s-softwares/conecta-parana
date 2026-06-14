import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/home_highlights.dart';

class ServicesGrid extends StatelessWidget {
  final List<HomeService> services;

  const ServicesGrid({super.key, required this.services});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: services.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: 16,
          crossAxisSpacing: 8,
          childAspectRatio: 0.8,
        ),
        itemBuilder: (context, index) {
          final service = services[index];
          return _ServiceItem(
            service: service,
            onTap: () => context.push(service.route),
          );
        },
      ),
    );
  }
}

class _ServiceItem extends StatelessWidget {
  final HomeService service;
  final VoidCallback onTap;

  const _ServiceItem({required this.service, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: service.label,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                _iconFor(service.icon),
                color: const Color(0xFF1A1A1A),
                size: 24,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              service.label,
              style: const TextStyle(fontSize: 12, color: Color(0xFF1A1A1A)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(String name) {
    switch (name) {
      case 'local_hospital_outlined':
        return Icons.local_hospital_outlined;
      case 'school_outlined':
        return Icons.school_outlined;
      case 'park_outlined':
        return Icons.park_outlined;
      case 'directions_bus_outlined':
        return Icons.directions_bus_outlined;
      case 'receipt_long_outlined':
        return Icons.receipt_long_outlined;
      case 'lightbulb_outline':
        return Icons.lightbulb_outline;
      case 'delete_outline':
        return Icons.delete_outline;
      case 'description_outlined':
        return Icons.description_outlined;
      default:
        return Icons.apps_outlined;
    }
  }
}
