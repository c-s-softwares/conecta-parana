import 'dart:async';

import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/features/city_switcher/presentation/controllers/active_city_provider.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/search/data/search_repository.dart';
import 'package:conectaparana/features/search/presentation/widgets/search_filter_panel.dart';
import 'package:conectaparana/features/search/presentation/widgets/search_result_card.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

enum _SearchStatus { idle, loading, success, error }

enum SearchInitialCategory { events }

class SearchPage extends StatefulWidget {
  const SearchPage({
    super.key,
    this.repository,
    this.initialQuery = '',
    this.city,
    this.initialCategory,
    this.cityLoader,
  });

  final SearchRepository? repository;
  final String initialQuery;
  final City? city;
  final SearchInitialCategory? initialCategory;
  final SearchCityLoader? cityLoader;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  late final SearchRepository _repository =
      widget.repository ?? SearchRepository();
  late final TextEditingController _controller = TextEditingController(
    text: widget.initialQuery,
  );
  late City? _city;

  Timer? _debounce;
  _SearchStatus _status = _SearchStatus.idle;
  late SearchResultType? _type;
  List<SearchResultItem> _items = const [];
  int _total = 0;
  bool _showFilterPanel = false;

  City? get _userCity {
    final user = AuthService.instance.currentUser.value;
    if (user == null || user.cityId.isEmpty) return null;
    return City(id: user.cityId, name: user.cityName);
  }

  @override
  void initState() {
    super.initState();
    final initialCity = widget.city ?? activeCityController.value ?? _userCity;
    _city = initialCity;
    _type = switch (widget.initialCategory) {
      SearchInitialCategory.events => SearchResultType.events,
      null => null,
    };
    if (widget.initialQuery.trim().length >= 3) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _search());
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onQueryChanged(String value) {
    setState(() {});
    _debounce?.cancel();
    if (value.trim().length < 3) {
      setState(() {
        _status = _SearchStatus.idle;
        _items = const [];
        _total = 0;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), _search);
  }

  Future<void> _search() async {
    final query = _controller.text.trim();
    if (query.length < 3) return;
    setState(() => _status = _SearchStatus.loading);
    try {
      final result = await _repository.search(
        query: query,
        cityId: _city?.hasValidBackendId == true ? _city!.id : null,
        types: _type,
      );
      if (!mounted || query != _controller.text.trim()) return;
      setState(() {
        _items = result.items;
        _total = result.total;
        _status = _SearchStatus.success;
      });
    } catch (_) {
      if (mounted) setState(() => _status = _SearchStatus.error);
    }
  }

  void _cancel() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  void _applyFilters(SearchFilterValue value) {
    setState(() {
      _city = value.city;
      _type = value.type;
      _showFilterPanel = false;
    });
    _search();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FA),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      key: const Key('active_search_input'),
                      controller: _controller,
                      autofocus: true,
                      textInputAction: TextInputAction.search,
                      onChanged: _onQueryChanged,
                      onSubmitted: (_) => _search(),
                      decoration: InputDecoration(
                        hintText: 'ubs zona',
                        prefixIcon: const Icon(
                          Icons.search,
                          color: Color(0xFF007A3D),
                        ),
                        suffixIcon: _controller.text.isEmpty
                            ? null
                            : IconButton(
                                key: const Key('clear_search_button'),
                                onPressed: () {
                                  _controller.clear();
                                  _onQueryChanged('');
                                },
                                icon: const Icon(Icons.cancel),
                              ),
                        filled: true,
                        fillColor: const Color(0xFFF0F3F3),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 16,
                        ),
                        border: _searchBorder(),
                        enabledBorder: _searchBorder(),
                        focusedBorder: _searchBorder(width: 1.6),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  TextButton(
                    key: const Key('cancel_search_button'),
                    onPressed: _cancel,
                    child: const Text(
                      'Cancelar',
                      style: TextStyle(
                        color: Color(0xFF006B39),
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            _buildChips(),
            const SizedBox(height: 12),
            Expanded(
              child: _showFilterPanel
                  ? SearchFilterPanel(
                      value: SearchFilterValue(city: _city, type: _type),
                      cityLoader: widget.cityLoader ?? loadAllSearchCities,
                      onApply: _applyFilters,
                      onCancel: () => setState(() => _showFilterPanel = false),
                    )
                  : _buildContent(),
            ),
          ],
        ),
      ),
    );
  }

  OutlineInputBorder _searchBorder({double width = 1.2}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(color: const Color(0xFF007A3D), width: width),
    );
  }

  Widget _buildChips() {
    return SizedBox(
      height: 42,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          if (_city != null) ...[
            _QuickChip(
              key: const Key('search_city_filter_chip'),
              label: _city!.name,
              onRemove: () {
                setState(() => _city = null);
                _search();
              },
            ),
            const SizedBox(width: 8),
          ],
          if (_type != null) ...[
            _QuickChip(
              key: const Key('search_type_filter_chip'),
              label: _typeLabel(_type!),
              onRemove: () {
                setState(() => _type = null);
                _search();
              },
            ),
            const SizedBox(width: 8),
          ],
          _QuickChip(
            key: const Key('open_search_filters_button'),
            label: 'Filtros',
            icon: Icons.filter_list,
            outlined: true,
            onTap: () => setState(() => _showFilterPanel = true),
          ),
        ],
      ),
    );
  }

  String _typeLabel(SearchResultType type) => switch (type) {
    SearchResultType.locals => 'Serviços',
    SearchResultType.news => 'Notícias',
    SearchResultType.events => 'Eventos',
    SearchResultType.communicates => 'Comunicados',
  };

  Widget _buildContent() {
    if (_status == _SearchStatus.loading) {
      return const Center(child: LoadingSpinner());
    }
    if (_status == _SearchStatus.error) {
      return EmptyState(
        icon: Icons.wifi_off_outlined,
        title: 'Não foi possível buscar',
        subtitle: 'Verifique sua conexão e tente novamente.',
        buttonLabel: 'Tentar novamente',
        onButtonTap: _search,
      );
    }
    if (_status == _SearchStatus.idle) {
      return const EmptyState(
        icon: Icons.search,
        title: 'Busque no Conecta Paraná',
        subtitle: 'Digite pelo menos 3 caracteres.',
      );
    }

    return ListView(
      key: const Key('search_results_list'),
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
      children: [
        Text(
          '$_total ${_total == 1 ? 'RESULTADO' : 'RESULTADOS'} PARA "${_controller.text.trim().toUpperCase()}"',
          style: const TextStyle(
            color: Color(0xFF56605D),
            fontSize: 12.5,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 14),
        if (_items.isEmpty)
          const SizedBox(
            height: 240,
            child: EmptyState(
              icon: Icons.search_off,
              title: 'Nenhum resultado encontrado',
            ),
          )
        else
          for (final item in _items) ...[
            SearchResultCard(
              item: item,
              cityName: _city?.name,
              onTap: () => context.push(item.detailRoute),
            ),
            const SizedBox(height: 10),
          ],
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF2F3),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFDDE3DF)),
          ),
          child: Column(
            children: [
              const Text(
                'Não encontrou?',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              TextButton(
                key: const Key('search_other_cities_button'),
                onPressed: () {
                  setState(() => _city = null);
                  _search();
                },
                child: const Text(
                  'Buscar em outras cidades do PR',
                  style: TextStyle(
                    color: Color(0xFF007A3D),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({
    super.key,
    required this.label,
    this.onRemove,
    this.onTap,
    this.icon,
    this.outlined = false,
  });

  final String label;
  final VoidCallback? onRemove;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      onPressed: onTap ?? onRemove,
      avatar: icon == null
          ? null
          : Icon(icon, size: 18, color: const Color(0xFF007A3D)),
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          if (onRemove != null) ...[
            const SizedBox(width: 5),
            const Icon(Icons.close, size: 17),
          ],
        ],
      ),
      backgroundColor: outlined ? Colors.white : const Color(0xFFF0F3F3),
      side: BorderSide(
        color: outlined ? const Color(0xFF9FCDB5) : const Color(0xFFDCE2DF),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      labelStyle: TextStyle(
        color: outlined ? const Color(0xFF007A3D) : const Color(0xFF17201E),
        fontSize: 14,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}
