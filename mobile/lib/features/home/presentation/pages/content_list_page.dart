import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/features/city_switcher/presentation/controllers/active_city_provider.dart';
import 'package:conectaparana/features/home/data/repositories/content_list_repository.dart';
import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/presentation/widgets/feed_item_card.dart';
import 'package:conectaparana/features/home/presentation/widgets/news_list_card.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ContentListPage extends StatefulWidget {
  const ContentListPage({super.key, required this.kind, this.repository});
  final ContentListKind kind;
  final ContentListRepository? repository;

  @override
  State<ContentListPage> createState() => _ContentListPageState();
}

class _ContentListPageState extends State<ContentListPage> {
  late final ContentListRepository _repository =
      widget.repository ?? ContentListRepository();
  final _controller = ScrollController();
  List<FeedItem> _items = const [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = false;
  Object? _error;
  int _page = 1;

  String get _title =>
      widget.kind == ContentListKind.communicates ? 'Comunicados' : 'Notícias';

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onScroll);
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_hasMore || _loadingMore || !_controller.hasClients) return;
    if (_controller.position.extentAfter < 200) _loadMore();
  }

  Future<ContentListResult> _request(int page) => _repository.load(
    kind: widget.kind,
    cityId:
        activeCityController.value?.id ??
        AuthService.instance.currentUser.value?.cityId,
    page: page,
  );

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await _request(1);
      if (!mounted) return;
      setState(() {
        _items = result.items;
        _hasMore = result.hasMore;
        _page = 1;
      });
    } catch (error) {
      if (mounted) setState(() => _error = error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    try {
      final result = await _request(_page + 1);
      if (!mounted) return;
      setState(() {
        _items = [..._items, ...result.items];
        _hasMore = result.hasMore;
        _page++;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível carregar mais.')),
      );
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      body: _loading
          ? const Center(child: LoadingSpinner())
          : _error != null
          ? EmptyState(
              icon: Icons.wifi_off_outlined,
              title: 'Não foi possível carregar',
              subtitle: 'Verifique sua conexão e tente novamente.',
              buttonLabel: 'Tentar novamente',
              onButtonTap: _load,
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: _items.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        const SizedBox(
                          height: 500,
                          child: EmptyState(
                            icon: Icons.inbox_outlined,
                            title: 'Nenhum conteúdo encontrado',
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      controller: _controller,
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      itemCount: _items.length + (_loadingMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _items.length) {
                          return const Padding(
                            padding: EdgeInsets.all(20),
                            child: Center(child: LoadingSpinner()),
                          );
                        }
                        final item = _items[index];
                        final route = widget.kind == ContentListKind.communicates
                            ? '/communicates/${item.id}'
                            : '/news/${item.id}';
                        if (widget.kind == ContentListKind.news) {
                          return NewsListCard(
                            item: item,
                            onTap: () => context.push(route),
                          );
                        }
                        return FeedItemCard(
                          item: item,
                          onTap: () => context.push(route),
                        );
                      },
                    ),
            ),
    );
  }
}
