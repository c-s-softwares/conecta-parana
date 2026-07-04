import 'package:flutter/material.dart';
import 'package:conectaparana/core/formatters/app_date_formatter.dart';
import 'package:conectaparana/shared/widgets/media/app_network_image.dart';
import 'package:conectaparana/shared/widgets/misc/avatar.dart';
import '../../domain/entities/feed_item.dart';

class NewsListCard extends StatelessWidget {
  final FeedItem item;
  final VoidCallback onTap;

  const NewsListCard({super.key, required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final photoUrl = item.photos.firstOrNull?.displayUrl ?? item.imageUrl;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Semantics(
        label: item.title,
        button: true,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEEEEE)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(13),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPhoto(photoUrl),
                _buildFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPhoto(String? photoUrl) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      child: Container(
        height: 180,
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF2E7D5E), Color(0xFF0D1F17)],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (photoUrl != null)
              AppNetworkImage(
                imageUrl: photoUrl,
                fit: BoxFit.cover,
                fallback: const SizedBox.shrink(),
              ),
            if (photoUrl != null) const ColoredBox(color: Color(0x52000000)),
            if (item.category != null)
              Positioned(
                left: 12,
                top: 12,
                child: _Tag(label: item.category!.toUpperCase()),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    final authorLabel = item.authorName ?? 'Prefeitura Municipal';
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A1A1A),
              height: 1.3,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Avatar(size: 28, name: authorLabel),
              const SizedBox(width: 8),
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        authorLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.verified,
                      size: 14,
                      color: Color(0xFF006733),
                    ),
                  ],
                ),
              ),
              if (item.date != null)
                Text(
                  AppDateFormatter.relative(item.date!),
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;

  const _Tag({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(38),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}
