import 'package:flutter/material.dart';

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
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: item.isPriority
                ? Border.all(color: const Color(0xFF006733), width: 1.5)
                : Border.all(color: const Color(0xFFEEEEEE)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(13),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildThumbnail(),
              Expanded(child: _buildContent(context)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(12),
        bottomLeft: Radius.circular(12),
      ),
      child: SizedBox(
        width: 96,
        height: 96,
        child: item.imageUrl != null
            ? Image.network(
                item.imageUrl!,
                fit: BoxFit.cover,
                // ignore: unnecessary_underscores
                errorBuilder: (_, __, _) => _placeholderIcon(),
              )
            : _placeholderIcon(),
      ),
    );
  }

  Widget _placeholderIcon() {
    return Container(
      color: const Color(0xFFFFF0EE),
      child: Center(
        child: Icon(
          _typeIcon(item.type),
          color: const Color(0xFF006733),
          size: 32,
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _TypeChip(type: item.type),
              if (item.isPriority) ...[
                const SizedBox(width: 6),
                _PriorityBadge(),
              ],
            ],
          ),
          const SizedBox(height: 6),
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A1A),
            ),
          ),
          if (item.subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              item.subtitle!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
          if (item.date != null) ...[
            const SizedBox(height: 6),
            _DateLabel(date: item.date!),
          ],
        ],
      ),
    );
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

  static IconData _typeIcon(FeedItemType type) {
    switch (type) {
      case FeedItemType.event:
        return Icons.event_outlined;
      case FeedItemType.comunicado:
        return Icons.campaign_outlined;
      case FeedItemType.news:
        return Icons.article_outlined;
    }
  }
}

class _TypeChip extends StatelessWidget {
  final FeedItemType type;

  const _TypeChip({required this.type});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _color.withAlpha(26),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: _color,
        ),
      ),
    );
  }

  Color get _color {
    switch (type) {
      case FeedItemType.event:
        return const Color(0xFF006733);
      case FeedItemType.comunicado:
        return const Color(0xFFE65100);
      case FeedItemType.news:
        return const Color(0xFF1565C0);
    }
  }

  String get _label {
    switch (type) {
      case FeedItemType.event:
        return 'EVENTO';
      case FeedItemType.comunicado:
        return 'COMUNICADO';
      case FeedItemType.news:
        return 'NOTÍCIA';
    }
  }
}

class _PriorityBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFF006733),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Text(
        'DESTAQUE',
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _DateLabel extends StatelessWidget {
  final DateTime date;

  const _DateLabel({required this.date});

  @override
  Widget build(BuildContext context) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;

    return Row(
      children: [
        const Icon(Icons.calendar_today_outlined, size: 11, color: Colors.grey),
        const SizedBox(width: 4),
        Text(
          '$day/$month/$year',
          style: const TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }
}
