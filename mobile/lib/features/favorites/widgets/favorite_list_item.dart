import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FavoriteListItem extends StatelessWidget {
  const FavoriteListItem({
    super.key,
    required this.item,
    this.onRemove,
    this.isRemoving = false,
  });

  final FavoriteItemModel item;
  final VoidCallback? onRemove;
  final bool isRemoving;

  void _handleTap(BuildContext context) {
    if (!item.isAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conteúdo não está mais disponível.')),
      );
      return;
    }

    context.push('${item.type.routeBase}/${item.id}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = _FavoriteItemTheme.from(item);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        key: Key('favorite_item_${item.id}'),
        onTap: () => _handleTap(context),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          constraints: const BoxConstraints(minHeight: 88),
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
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
                  color: theme.backgroundColor,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Icon(theme.icon, color: theme.foregroundColor, size: 25),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      item.tagLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: theme.foregroundColor,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.35,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF0C1714),
                        fontSize: 16,
                        height: 1.12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 48,
                height: 62,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      item.metadataLabel,
                      maxLines: 1,
                      style: const TextStyle(
                        color: Color(0xFF858B89),
                        fontSize: 12.5,
                      ),
                    ),
                    if (!item.isAvailable)
                      const Text(
                        'Removido',
                        style: TextStyle(
                          color: Color(0xFF858B89),
                          fontSize: 10,
                        ),
                      )
                    else
                      SizedBox(
                        width: 36,
                        height: 36,
                        child: IconButton(
                          key: Key('remove_favorite_${item.id}'),
                          tooltip: 'Remover dos salvos',
                          padding: EdgeInsets.zero,
                          onPressed: isRemoving ? null : onRemove,
                          icon: isRemoving
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Color(0xFF007A3D),
                                  ),
                                )
                              : const Icon(
                                  Icons.bookmark,
                                  color: Color(0xFF007A3D),
                                  size: 23,
                                ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FavoriteItemTheme {
  const _FavoriteItemTheme({
    required this.icon,
    required this.foregroundColor,
    required this.backgroundColor,
  });

  final IconData icon;
  final Color foregroundColor;
  final Color backgroundColor;

  factory _FavoriteItemTheme.from(FavoriteItemModel item) {
    return switch (item.type) {
      FavoriteItemType.news => const _FavoriteItemTheme(
        icon: Icons.article_outlined,
        foregroundColor: Color(0xFF087541),
        backgroundColor: Color(0xFFDCEBE1),
      ),
      FavoriteItemType.event => const _FavoriteItemTheme(
        icon: Icons.calendar_month_outlined,
        foregroundColor: Color(0xFFE18B00),
        backgroundColor: Color(0xFFF4EAD6),
      ),
      FavoriteItemType.local => const _FavoriteItemTheme(
        icon: Icons.location_on_outlined,
        foregroundColor: Color(0xFFD86662),
        backgroundColor: Color(0xFFF3E3E0),
      ),
      FavoriteItemType.communicate => const _FavoriteItemTheme(
        icon: Icons.notifications_none,
        foregroundColor: Color(0xFFB66B00),
        backgroundColor: Color(0xFFF1EAD8),
      ),
    };
  }
}
