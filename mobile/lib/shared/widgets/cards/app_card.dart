import 'package:flutter/material.dart';

enum AppCardVariant {
  event,        
  announcement, 
  news,         
  local,        
}

class AppCard extends StatelessWidget {
  final AppCardVariant variant;
  final String title;
  final String? subtitle;
  final String? label;
  final String? category;
  final String? imageUrl;
  final String? distance;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.variant,
    required this.title,
    this.subtitle,
    this.label,
    this.category,
    this.imageUrl,
    this.distance,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: title,
      button: onTap != null,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: _buildCard(),
        ),
      ),
    );
  }

  Widget _buildCard() {
    if (variant == AppCardVariant.event) {
      return _buildEventCard();
    }

    if (variant == AppCardVariant.announcement) {
      return _buildHorizontalCard(const Color(0xFFD4820A), Icons.campaign_outlined);
    }

    if (variant == AppCardVariant.news) {
      return _buildHorizontalCard(const Color(0xFF2A7A7A), Icons.article_outlined);
    }

    return _buildLocalCard();
  }

  Widget _buildEventCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
          child: imageUrl != null
              ? Image.network(
                  imageUrl!,
                  height: 140,
                  width: double.infinity,
                  fit: BoxFit.cover,
                )
              : Container(
                  height: 140,
                  width: double.infinity,
                  color: const Color(0xFF006733).withValues(alpha: 0.15),
                  child: const Icon(Icons.event, color: Color(0xFF006733), size: 32),
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (label != null)
                Text(
                  label!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF006733),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              const SizedBox(height: 4),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      subtitle!,
                      style: const TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHorizontalCard(Color labelColor, IconData placeholderIcon) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (label != null)
                  Text(
                    label!,
                    style: TextStyle(
                      fontSize: 11,
                      color: labelColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imageUrl != null
                ? Image.network(
                    imageUrl!,
                    height: 80,
                    width: 80,
                    fit: BoxFit.cover,
                  )
                : Container(
                    height: 80,
                    width: 80,
                    color: labelColor.withValues(alpha: 0.15),
                    child: Icon(placeholderIcon, color: labelColor, size: 24),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocalCard() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFE53935),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.home_outlined, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (category != null)
                  Text(
                    category!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF006733),
                    ),
                  ),
              ],
            ),
          ),
          if (distance != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF0EE),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                distance!,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
    );
  }
}