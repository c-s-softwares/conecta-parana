import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/misc/loading_skeleton.dart';

class SuggestionsSkeleton extends StatelessWidget {
  const SuggestionsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: 4,
      itemBuilder: (_, _) => Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFEEEEEE)),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LoadingSkeleton(width: 100, height: 12),
            SizedBox(height: 10),
            LoadingSkeleton(width: 200, height: 16),
            SizedBox(height: 10),
            LoadingSkeleton(width: 80, height: 12),
          ],
        ),
      ),
    );
  }
}