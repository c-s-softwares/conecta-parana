import 'package:conectaparana/features/favorites/data/favorite_item_model.dart';
import 'package:conectaparana/features/favorites/data/favorites_change_notifier.dart';
import 'package:conectaparana/features/favorites/data/favorites_service.dart';
import 'package:conectaparana/features/favorites/widgets/favorite_list_item.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

enum _FavoritesFilter { all, news, events, locals }

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key, FavoritesService? service})
    : _service = service;

  final FavoritesService? _service;

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  late final FavoritesService _service = widget._service ?? FavoritesService();

  List<FavoriteItemModel> _items = const [];
  _FavoritesFilter _filter = _FavoritesFilter.all;
  bool _loading = true;
  bool _refreshing = false;
  bool _hasError = false;
  final Set<String> _removingIds = {};

  List<FavoriteItemModel> get _visibleItems {
    return switch (_filter) {
      _FavoritesFilter.all => _items,
      _FavoritesFilter.news =>
        _items
            .where((item) => item.type == FavoriteItemType.news)
            .toList(growable: false),
      _FavoritesFilter.events =>
        _items
            .where((item) => item.type == FavoriteItemType.event)
            .toList(growable: false),
      _FavoritesFilter.locals =>
        _items
            .where((item) => item.type == FavoriteItemType.local)
            .toList(growable: false),
    };
  }

  @override
  void initState() {
    super.initState();
    favoritesChangeNotifier.addListener(_onFavoritesChanged);
    _load();
  }

  @override
  void dispose() {
    favoritesChangeNotifier.removeListener(_onFavoritesChanged);
    super.dispose();
  }

  void _onFavoritesChanged() {
    if (mounted) _load(showLoading: false);
  }

  Future<void> _load({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _loading = true;
        _hasError = false;
      });
    } else {
      setState(() => _refreshing = true);
    }

    try {
      final items = await _service.getMyFavorites();
      if (!mounted) return;
      setState(() {
        _items = items;
        _hasError = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _hasError = true);
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _refreshing = false;
        });
      }
    }
  }

  Future<void> _remove(FavoriteItemModel item) async {
    if (_removingIds.contains(item.id)) return;

    final index = _items.indexOf(item);
    setState(() {
      _removingIds.add(item.id);
      _items = _items.where((candidate) => candidate != item).toList();
    });

    try {
      await _service.remove(item);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        final restored = [..._items];
        final restoreIndex = index < 0
            ? restored.length
            : index.clamp(0, restored.length);
        restored.insert(restoreIndex, item);
        _items = restored;
      });
      AppToast.show(
        context,
        message: 'Não foi possível atualizar os salvos.',
        variant: AppToastVariant.error,
      );
    } finally {
      if (mounted) setState(() => _removingIds.remove(item.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FA),
      body: SafeArea(
        child: Column(
          children: [
            _FavoritesHeader(
              itemCount: _items.length,
              onBack: () =>
                  context.canPop() ? context.pop() : context.go('/profile'),
            ),
            _FilterBar(
              selected: _filter,
              onSelected: (filter) => setState(() => _filter = filter),
            ),
            Expanded(child: _buildContent()),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) return const Center(child: LoadingSpinner());

    if (_hasError && _items.isEmpty) {
      return EmptyState(
        icon: Icons.wifi_off_outlined,
        title: 'Não foi possível carregar seus salvos.',
        subtitle: 'Verifique sua conexão e tente novamente.',
        buttonLabel: 'Tentar novamente',
        onButtonTap: _load,
      );
    }

    final visibleItems = _visibleItems;

    return RefreshIndicator(
      color: const Color(0xFF007A3D),
      onRefresh: () => _load(showLoading: false),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          const Text(
            'SALVOS RECENTEMENTE',
            style: TextStyle(
              color: Color(0xFF56605D),
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.35,
            ),
          ),
          const SizedBox(height: 14),
          if (_refreshing)
            const LinearProgressIndicator(
              minHeight: 2,
              color: Color(0xFF007A3D),
            ),
          if (visibleItems.isEmpty)
            SizedBox(
              height: 360,
              child: EmptyState(
                icon: Icons.bookmark_border,
                title: _items.isEmpty
                    ? 'Você ainda não salvou nada'
                    : 'Nenhum salvo neste filtro',
                subtitle: _items.isEmpty
                    ? 'Toque no bookmark para guardar seus conteúdos favoritos.'
                    : 'Escolha outro filtro para ver mais itens.',
              ),
            )
          else
            for (final item in visibleItems) ...[
              FavoriteListItem(
                item: item,
                isRemoving: _removingIds.contains(item.id),
                onRemove: () => _remove(item),
              ),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}

class _FavoritesHeader extends StatelessWidget {
  const _FavoritesHeader({required this.itemCount, required this.onBack});

  final int itemCount;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
      child: Row(
        children: [
          Material(
            color: const Color(0xFFEEF1F2),
            shape: const CircleBorder(),
            child: IconButton(
              key: const Key('favorites_back_button'),
              tooltip: 'Voltar',
              onPressed: onBack,
              icon: const Icon(Icons.chevron_left, size: 28),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Salvos',
              style: TextStyle(
                color: Color(0xFF0C1714),
                fontSize: 30,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          Container(
            key: const Key('favorites_count_badge'),
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
            decoration: BoxDecoration(
              color: const Color(0xFFEAF4EE),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.bookmark_border,
                  size: 19,
                  color: Color(0xFF007A3D),
                ),
                const SizedBox(width: 7),
                Text(
                  '$itemCount ${itemCount == 1 ? 'item' : 'itens'}',
                  style: const TextStyle(
                    color: Color(0xFF007A3D),
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.selected, required this.onSelected});

  final _FavoritesFilter selected;
  final ValueChanged<_FavoritesFilter> onSelected;

  @override
  Widget build(BuildContext context) {
    const filters = [
      (_FavoritesFilter.all, 'Todos'),
      (_FavoritesFilter.news, 'Notícias'),
      (_FavoritesFilter.events, 'Eventos'),
      (_FavoritesFilter.locals, 'Locais'),
    ];

    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: filters.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final (filter, label) = filters[index];
          final active = selected == filter;
          return ChoiceChip(
            key: Key('favorites_filter_${filter.name}'),
            label: Text(label),
            selected: active,
            showCheckmark: false,
            onSelected: (_) => onSelected(filter),
            backgroundColor: const Color(0xFFF0F3F3),
            selectedColor: const Color(0xFF007A3D),
            side: BorderSide(
              color: active ? const Color(0xFF007A3D) : const Color(0xFFDCE2DF),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            labelPadding: const EdgeInsets.symmetric(horizontal: 13),
            labelStyle: TextStyle(
              color: active ? Colors.white : const Color(0xFF4E5956),
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          );
        },
      ),
    );
  }
}
