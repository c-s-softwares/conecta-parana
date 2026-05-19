import 'package:flutter/material.dart';

class LoadingSpinner extends StatelessWidget {
  final Color? color;
  final double size;

  const LoadingSpinner({
    super.key,
    this.color,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Carregando',
      child: SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          color: color ?? Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}