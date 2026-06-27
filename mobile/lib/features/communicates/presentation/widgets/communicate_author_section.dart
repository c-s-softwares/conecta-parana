import 'package:flutter/material.dart';

class CommunicateAuthorSection extends StatelessWidget {
  final String authorName;

  const CommunicateAuthorSection({
    super.key,
    required this.authorName,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          child: Text(
            authorName.substring(0, 1),
          ),
        ),

        const SizedBox(width: 12),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authorName,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 2),

              const Text(
                'Publicado às 09:14',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),

        OutlinedButton(
          onPressed: () {},
          child: const Text('Seguir'),
        ),
      ],
    );
  }
}