import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:conectaparana/features/favorites/widgets/favorite_list_item.dart';
import 'package:flutter/material.dart';

class FavoriteSection extends StatelessWidget {
  const FavoriteSection({super.key, required this.type, required this.items});

  final FavoriteItemType type;
  final List<FavoriteItemModel> items;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${type.label} (${items.length})',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: FavoriteListItem(item: item),
            ),
          ),
        ],
      ),
    );
  }
}
