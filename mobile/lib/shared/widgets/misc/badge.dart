import 'package:flutter/material.dart';

enum AppBadgeVariant { green, orange, teal, red, blue, grey, purple }

class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.green,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _getColors();

    return Semantics(
      label: label,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: colors['background'],
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: colors['text'],
          ),
        ),
      ),
    );
  }

  Map<String, Color> _getColors() {
    if (variant == AppBadgeVariant.green) {
      return {
        'background': const Color(0xFFFFF0EE),
        'text': const Color(0xFF006733),
      };
    }

    if (variant == AppBadgeVariant.orange) {
      return {
        'background': const Color(0xFFFFF3E0),
        'text': const Color(0xFFD4820A),
      };
    }

    if (variant == AppBadgeVariant.teal) {
      return {
        'background': const Color(0xFFE0F2F1),
        'text': const Color(0xFF2A7A7A),
      };
    }

    if (variant == AppBadgeVariant.blue) {
      return {
        'background': const Color(0xFFE3F2FD),
        'text': const Color(0xFF1565C0),
      };
    }

    if (variant == AppBadgeVariant.grey) {
      return {
        'background': const Color(0xFFF5F5F5),
        'text': const Color(0xFF616161),
      };
    }

    if (variant == AppBadgeVariant.purple) {
      return {
        'background': const Color(0xFFEDE7F6),
        'text': const Color(0xFF7E57C2),
      };
    }

    return {
      'background': const Color(0xFFFFEBEE),
      'text': const Color(0xFFE53935),
    };
  }
}
