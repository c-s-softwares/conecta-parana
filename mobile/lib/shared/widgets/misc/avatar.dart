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
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFF006733),
        ),
        child: imageUrl != null
            ? ClipOval(
                child: Image.network(
                  imageUrl!,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _buildInitials(),
                ),
              )
            : _buildInitials(),
      ),
    );
  }

  Widget _buildInitials() {
    final initials = name != null && name!.isNotEmpty
        ? name!.trim().split(' ').map((e) => e[0]).take(2).join().toUpperCase()
        : '?';

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