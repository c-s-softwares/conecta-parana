import 'package:conectaparana/features/search/data/search_repository.dart';
import 'package:flutter/material.dart';

class SearchResultCard extends StatelessWidget {
  const SearchResultCard({
    super.key,
    required this.item,
    required this.cityName,
    this.onTap,
  });

  final SearchResultItem item;
  final String? cityName;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = _ResultTheme.from(item);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        key: Key('search_result_${item.types.name}_${item.id}'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          constraints: const BoxConstraints(minHeight: 94),
          padding: const EdgeInsets.fromLTRB(14, 13, 12, 13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFDDE3DF)),
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: theme.background,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Icon(theme.icon, color: theme.foreground, size: 27),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _typeLabel(item.types),
                      style: TextStyle(
                        color: theme.foreground,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.55,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF0D1714),
                        fontSize: 16,
                        height: 1.12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _subtitle(item, cityName),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF606966),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.chevron_right,
                color: Color(0xFF59635F),
                size: 23,
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _typeLabel(SearchResultType type) => switch (type) {
    SearchResultType.locals => 'SERVIÇO',
    SearchResultType.news => 'NOTÍCIA',
    SearchResultType.events => 'EVENTO',
    SearchResultType.communicates => 'COMUNICADO',
  };

  static String _subtitle(SearchResultItem item, String? cityName) {
    final parts = <String>[];
    final category = item.category?.trim().replaceAll('_', ' ');
    if (category != null && category.isNotEmpty) parts.add(category);

    if (item.types == SearchResultType.locals) {
      final address = item.address?.trim();
      if (address != null && address.isNotEmpty) parts.add(address);
      if (cityName != null && cityName.isNotEmpty) parts.add(cityName);
    } else if (item.types == SearchResultType.events && item.date != null) {
      parts.add(_dayMonth(item.date!));
    } else if (item.date != null) {
      parts.add(_relativeTime(item.date!));
    }

    if (parts.isEmpty && item.description?.trim().isNotEmpty == true) {
      parts.add(item.description!.trim());
    }
    return parts.isEmpty ? 'Conecta Paraná' : parts.join(' • ');
  }

  static String _dayMonth(DateTime date) {
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    final local = date.toLocal();
    return '${local.day} ${months[local.month - 1]}';
  }

  static String _relativeTime(DateTime date) {
    final difference = DateTime.now().difference(date.toLocal());
    if (difference.inMinutes < 1) return 'agora';
    if (difference.inHours < 1) return '${difference.inMinutes}min atrás';
    if (difference.inDays < 1) return '${difference.inHours}h atrás';
    return '${difference.inDays}d atrás';
  }
}

class _ResultTheme {
  const _ResultTheme(this.icon, this.foreground, this.background);

  final IconData icon;
  final Color foreground;
  final Color background;

  factory _ResultTheme.from(SearchResultItem item) {
    if (item.types == SearchResultType.locals) {
      final title = item.title.toLowerCase();
      if (title.contains('ubs') || title.contains('upa')) {
        return const _ResultTheme(
          Icons.local_hospital_outlined,
          Color(0xFFD96561),
          Color(0xFFF3E2DE),
        );
      }
      if (title.contains('escola') || title.contains('cmei')) {
        return const _ResultTheme(
          Icons.school_outlined,
          Color(0xFF0098C7),
          Color(0xFFD8F1F7),
        );
      }
      if (title.contains('parque')) {
        return const _ResultTheme(
          Icons.park_outlined,
          Color(0xFF43863C),
          Color(0xFFDCEBDC),
        );
      }
      return const _ResultTheme(
        Icons.place_outlined,
        Color(0xFF087541),
        Color(0xFFDCEBE1),
      );
    }

    return switch (item.types) {
      SearchResultType.news => const _ResultTheme(
        Icons.article_outlined,
        Color(0xFF087541),
        Color(0xFFDCEBE1),
      ),
      SearchResultType.events => const _ResultTheme(
        Icons.calendar_month_outlined,
        Color(0xFFE18B00),
        Color(0xFFF4EAD6),
      ),
      SearchResultType.communicates => const _ResultTheme(
        Icons.notifications_none,
        Color(0xFFB66B00),
        Color(0xFFF1EAD8),
      ),
      SearchResultType.locals => throw StateError('handled above'),
    };
  }
}
