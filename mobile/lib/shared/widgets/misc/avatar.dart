import 'package:flutter/material.dart';

class Avatar extends StatelessWidget {
  final String? imageUrl;
  final String? name;
  final double size;

  const Avatar({
    super.key,
    this.imageUrl,
    this.name,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: name ?? 'Avatar',
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Color(0xFF006733),
        ),
        child: imageUrl != null
            ? ClipOval(
                child: Image.network(
                  imageUrl!,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorBuilder: (_, e, s) => _buildInitials(),
                ),
              )
            : _buildInitials(),
      ),
    );
  }

  Widget _buildInitials() {
    String initials = '?';
    if (name != null && name!.isNotEmpty) {
      final parts = name!.trim().split(RegExp(r'\s+'));
      final first = parts.first[0];
      final last = parts.length > 1 ? parts.last[0] : '';
      initials = '$first$last'.toUpperCase();
    }

    return Center(
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.35,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}