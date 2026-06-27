import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FavoriteListItem extends StatelessWidget {
  const FavoriteListItem({super.key, required this.item});

  final FavoriteItemModel item;

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
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        onTap: () => _handleTap(context),
        title: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: item.description == null
            ? null
            : Text(
                item.description!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
        trailing: item.isAvailable
            ? const Icon(Icons.chevron_right)
            : Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text('Removido', style: TextStyle(fontSize: 12)),
              ),
      ),
    );
  }
}
