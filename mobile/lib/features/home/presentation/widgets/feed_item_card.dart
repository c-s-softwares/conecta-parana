import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/media/app_network_image.dart';
import 'package:conectaparana/shared/widgets/misc/avatar.dart';

import '../../domain/entities/feed_item.dart';

class FeedItemCard extends StatelessWidget {
  final FeedItem item;
  final VoidCallback onTap;

  const FeedItemCard({super.key, required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '${_typeLabel(item.type)}: ${item.title}',
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 104),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: item.isPriority
                ? Border.all(color: const Color(0xFF006733), width: 1.5)
                : Border.all(color: const Color(0xFFE1E5E2)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0D000000),
                blurRadius: 5,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(child: _buildContent()),
              const SizedBox(width: 12),
              _buildThumbnail(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    final photoUrl = item.photos.firstOrNull?.displayUrl ?? item.imageUrl;
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        width: 80,
        height: 80,
        child: photoUrl != null && photoUrl.isNotEmpty
            ? AppNetworkImage(
                imageUrl: photoUrl,
                fit: BoxFit.cover,
                fallback: _placeholderIcon(),
              )
            : _placeholderIcon(),
      ),
    );
  }

  Widget _placeholderIcon() {
    return Container(
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(horizontal: 7),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF07A15), Color(0xFFC84B00)],
        ),
      ),
      child: Center(
        child: Text(
          _thumbnailLabel(item.title),
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 10,
            height: 1.05,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          _categoryLabel,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 10,
            height: 1.1,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
            color: Color(0xFF006733),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          item.title,
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 14,
            height: 1.08,
            fontWeight: FontWeight.w800,
            color: Color(0xFF171A18),
          ),
        ),
        if (item.authorName != null) ...[
          const SizedBox(height: 7),
          Row(
            children: [
              Avatar(size: 14, name: item.authorName),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  item.authorName!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    height: 1.1,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF777E7A),
                  ),
                ),
              ),
            ],
          ),
        ] else if (item.subtitle != null &&
            item.subtitle!.trim().isNotEmpty) ...[
          const SizedBox(height: 7),
          Text(
            item.subtitle!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              height: 1.1,
              fontWeight: FontWeight.w500,
              color: Color(0xFF777E7A),
            ),
          ),
        ],
      ],
    );
  }

  String get _categoryLabel {
    final type = _typeLabel(item.type).toUpperCase();
    final category = item.category?.trim();
    if (category == null || category.isEmpty) return type;
    return '$type · ${category.toUpperCase()}';
  }

  static String _thumbnailLabel(String title) {
    final year = RegExp(r'\b(20\d{2})\b').firstMatch(title)?.group(1);
    if (title.toLowerCase().contains('orçamento') && year != null) {
      return 'Orçamento\n$year';
    }

    final words = title.trim().split(RegExp(r'\s+'));
    return words.take(3).join('\n');
  }

  static String _typeLabel(FeedItemType type) {
    switch (type) {
      case FeedItemType.event:
        return 'Evento';
      case FeedItemType.comunicado:
        return 'Comunicado';
      case FeedItemType.news:
        return 'Notícia';
    }
  }
}
