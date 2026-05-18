import 'package:flutter/material.dart';

enum AppToastVariant {
  success, 
  error,   
  info,    
}

class AppToast {
  static void show(
    BuildContext context, {
    required String message,
    AppToastVariant variant = AppToastVariant.info,
  }) {
    final colors = _getColors(variant);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(_getIcon(variant), color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: colors,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  static Color _getColors(AppToastVariant variant) {
    if (variant == AppToastVariant.success) {
      return const Color(0xFF006733);
    }

    if (variant == AppToastVariant.error) {
      return const Color(0xFFE53935);
    }

    return const Color(0xFF424242);
  }

  static IconData _getIcon(AppToastVariant variant) {
    if (variant == AppToastVariant.success) {
      return Icons.check_circle_outline;
    }

    if (variant == AppToastVariant.error) {
      return Icons.error_outline;
    }

    return Icons.info_outline;
  }
}