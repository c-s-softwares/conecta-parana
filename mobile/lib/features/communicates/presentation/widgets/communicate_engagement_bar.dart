import 'package:flutter/material.dart';

class CommunicateEngagementBar extends StatelessWidget {
  const CommunicateEngagementBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _EngagementButton(
          icon: Icons.favorite_border,
          label: '67',
          onTap: () {},
        ),
        const SizedBox(width: 8),
        _EngagementButton(
          icon: Icons.bookmark_border,
          label: 'Salvar',
          onTap: () {},
        ),
        const SizedBox(width: 8),
        _EngagementButton(
          icon: Icons.share_outlined,
          label: '19',
          onTap: () {},
        ),
      ],
    );
  }
}

class _EngagementButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _EngagementButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
      ),
    );
  }
}
