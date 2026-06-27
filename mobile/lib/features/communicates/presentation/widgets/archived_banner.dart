import 'package:flutter/material.dart';

class ArchivedBanner extends StatelessWidget {
  const ArchivedBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text(
        'Este comunicado foi arquivado.',
        style: TextStyle(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}