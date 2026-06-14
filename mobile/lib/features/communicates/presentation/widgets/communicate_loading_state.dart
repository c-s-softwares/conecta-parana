import 'package:flutter/material.dart';

class CommunicateLoadingState extends StatelessWidget {
  const CommunicateLoadingState({super.key});

  Widget _skeleton({
    double height = 20,
    double width = double.infinity,
  }) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _skeleton(height: 220),

          const SizedBox(height: 24),

          _skeleton(height: 32, width: 260),

          const SizedBox(height: 16),

          _skeleton(width: 180),

          const SizedBox(height: 32),

          Row(
            children: [
              _skeleton(height: 48, width: 48),

              const SizedBox(width: 12),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _skeleton(width: 140),
                    const SizedBox(height: 8),
                    _skeleton(width: 100),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          _skeleton(height: 120),

          const SizedBox(height: 24),

          _skeleton(height: 20),
          const SizedBox(height: 12),
          _skeleton(height: 20),
          const SizedBox(height: 12),
          _skeleton(height: 20),
        ],
      ),
    );
  }
}