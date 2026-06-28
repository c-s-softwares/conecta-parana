import 'package:flutter/material.dart';

class MapPage extends StatelessWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mapa')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Container(
            key: const Key('map_unavailable_banner'),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF7F1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFB7DEC4)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline, color: Color(0xFF006733)),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'A função de mapa estará disponível em breve!',
                    style: TextStyle(
                      color: Color(0xFF163B27),
                      fontWeight: FontWeight.w600,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
