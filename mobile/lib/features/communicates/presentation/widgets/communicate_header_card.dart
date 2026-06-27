import 'package:flutter/material.dart';

class CommunicateHeaderCard extends StatelessWidget {
  const CommunicateHeaderCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color.fromARGB(255, 4, 94, 43), Color.fromARGB(255, 4, 94, 43)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'COMUNICADO OFICIAL',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              const SizedBox(width: 8),

              const Text(
                'Coleta de lixo',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),

          const SizedBox(height: 16),

          const Text(
            'Coleta de lixo será reorganizada por bairro a partir de segunda',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
          ),

          const SizedBox(height: 16),

          const Row(
            children: [
              Icon(Icons.location_on_outlined, color: Colors.white70, size: 18),

              SizedBox(width: 4),

              Text('Curitiba, PR', style: TextStyle(color: Colors.white70)),

              SizedBox(width: 16),

              Icon(Icons.access_time, color: Colors.white70, size: 18),

              SizedBox(width: 4),

              Text('08 mai 2026', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ],
      ),
    );
  }
}
