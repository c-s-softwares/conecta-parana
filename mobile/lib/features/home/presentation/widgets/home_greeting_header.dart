import 'package:flutter/material.dart';

class HomeGreetingHeader extends StatelessWidget {
  final String? userName;

  const HomeGreetingHeader({super.key, this.userName});

  @override
  Widget build(BuildContext context) {
    final greeting = userName != null && userName!.isNotEmpty
        ? 'Boa tarde, $userName'
        : 'Boa tarde';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            greeting,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
          ),
          const SizedBox(height: 4),
          RichText(
            text: const TextSpan(
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1A1A1A),
                height: 1.2,
              ),
              children: [
                TextSpan(text: 'O que está\n'),
                TextSpan(
                  text: 'acontecendo',
                  style: TextStyle(color: Color(0xFF006733)),
                ),
                TextSpan(text: ' hoje'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
