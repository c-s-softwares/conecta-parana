import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:conectaparana/features/favorites/data/favorites_service.dart';
import 'package:conectaparana/features/favorites/widgets/favorite_section.dart';
import 'package:flutter/material.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key, FavoritesService? service})
    : _service = service;

  final FavoritesService? _service;

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  late final FavoritesService _service = widget._service ?? FavoritesService();

  late Future<List<FavoriteItemModel>> _future = _load();

  Future<List<FavoriteItemModel>> _load() {
    return _service.getMyFavorites();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = _load();
    });

    await _future;
  }

  Map<FavoriteItemType, List<FavoriteItemModel>> _groupItems(
    List<FavoriteItemModel> items,
  ) {
    return {
      FavoriteItemType.event: items
          .where((item) => item.type == FavoriteItemType.event)
          .toList(),
      FavoriteItemType.communicate: items
          .where((item) => item.type == FavoriteItemType.communicate)
          .toList(),
      FavoriteItemType.news: items
          .where((item) => item.type == FavoriteItemType.news)
          .toList(),
      FavoriteItemType.local: items
          .where((item) => item.type == FavoriteItemType.local)
          .toList(),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meus Salvos')),
      body: FutureBuilder<List<FavoriteItemModel>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Não foi possível carregar seus salvos.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _future = _load();
                        });
                      },
                      child: const Text('Tentar novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          final items = snapshot.data ?? [];

          if (items.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Você ainda não salvou nada. Toque no bookmark para guardar.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final groupedItems = _groupItems(items);

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final entry in groupedItems.entries)
                  if (entry.value.isNotEmpty)
                    FavoriteSection(type: entry.key, items: entry.value),
              ],
            ),
          );
        },
      ),
    );
  }
}
