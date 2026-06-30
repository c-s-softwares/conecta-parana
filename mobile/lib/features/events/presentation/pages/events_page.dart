import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/router/app_router.dart';
import 'package:conectaparana/features/city_switcher/presentation/controllers/active_city_provider.dart';
import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_featured_banner.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_list_card.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_week_card.dart';
import 'package:conectaparana/shared/widgets/misc/app_chip.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:conectaparana/shared/widgets/misc/section_header.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

enum EventListFilter { todos, hoje, estaSemana, esteMes, proximos }

enum _EventsStatus { loading, success, empty, error, loadingMore, errorMore }

class EventsPage extends StatefulWidget {
  final EventRepository? repository;
  final EventListFilter initialFilter;
  final ValueListenable<City?>? activeCityListenable;

  const EventsPage({
    super.key,
    this.repository,
    this.initialFilter = EventListFilter.todos,
    this.activeCityListenable,
  });

  @override
  State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> {
  static const _pageSize = 10;

  late final EventRepository _repository;
  late final ValueListenable<City?> _activeCityListenable;
  final _scrollController = ScrollController();

  late EventListFilter _filter = widget.initialFilter;
  _EventsStatus _status = _EventsStatus.loading;
  List<EventListItem> _events = [];
  int _page = 1;
  bool _hasMore = false;
  int _requestVersion = 0;
  String? _loadedCityId;

  String? get _activeCityId =>
      _activeCityListenable.value?.id ??
      AuthService.instance.currentUser.value?.cityId;

  String? get _activeCityName =>
      _activeCityListenable.value?.name ??
      AuthService.instance.currentUser.value?.cityName;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RemoteEventRepository();
    _activeCityListenable = widget.activeCityListenable ?? activeCityController;
    _activeCityListenable.addListener(_onActiveCityChanged);
    _scrollController.addListener(_onScroll);
    _loadEvents();
  }

  @override
  void dispose() {
    _requestVersion++;
    _activeCityListenable.removeListener(_onActiveCityChanged);
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onActiveCityChanged() {
    if (!mounted) return;

    final cityId = _activeCityListenable.value?.id;
    if (cityId == null || cityId.isEmpty || cityId == _loadedCityId) return;

    setState(() {
      _events = [];
      _page = 1;
      _hasMore = false;
    });
    _loadEvents();
  }

  void _onScroll() {
    if (!_scrollController.hasClients || !_hasMore) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadEvents({bool refresh = false}) async {
    final cityId = _activeCityId;
    final requestVersion = ++_requestVersion;
    _loadedCityId = cityId;
    if (!refresh) setState(() => _status = _EventsStatus.loading);

    try {
      final page = await _repository.getEvents(
        cityId: cityId,
        from: _filterFrom,
        to: _filterTo,
        page: 1,
        pageSize: _pageSize,
      );

      if (!mounted || requestVersion != _requestVersion) return;
      setState(() {
        _events = page.items;
        _page = page.page;
        _hasMore = page.hasMore;
        _status = page.items.isEmpty
            ? _EventsStatus.empty
            : _EventsStatus.success;
      });
    } catch (_) {
      if (!mounted || requestVersion != _requestVersion) return;
      setState(() {
        _status = _events.isEmpty ? _EventsStatus.error : _EventsStatus.success;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_status == _EventsStatus.loadingMore || !_hasMore) return;

    setState(() => _status = _EventsStatus.loadingMore);
    final cityId = _activeCityId;
    final requestVersion = _requestVersion;

    try {
      final page = await _repository.getEvents(
        cityId: cityId,
        from: _filterFrom,
        to: _filterTo,
        page: _page + 1,
        pageSize: _pageSize,
      );

      if (!mounted ||
          requestVersion != _requestVersion ||
          cityId != _activeCityId) {
        return;
      }
      setState(() {
        _events = [..._events, ...page.items];
        _page = page.page;
        _hasMore = page.hasMore;
        _status = _EventsStatus.success;
      });
    } catch (_) {
      if (mounted && requestVersion == _requestVersion) {
        setState(() => _status = _EventsStatus.errorMore);
      }
    }
  }

  void _setFilter(EventListFilter filter) {
    if (_filter == filter) return;
    setState(() {
      _filter = filter;
      _events = [];
      _page = 1;
      _hasMore = false;
    });
    _loadEvents();
  }

  DateTime? get _filterFrom {
    final now = DateTime.now();
    return switch (_filter) {
      EventListFilter.todos => null,
      _ => DateTime(now.year, now.month, now.day),
    };
  }

  DateTime? get _filterTo {
    final now = DateTime.now();
    return switch (_filter) {
      EventListFilter.todos => null,
      EventListFilter.proximos => null,
      EventListFilter.hoje => DateTime(
        now.year,
        now.month,
        now.day,
        23,
        59,
        59,
      ),
      EventListFilter.estaSemana => DateTime(
        now.year,
        now.month,
        now.day,
      ).add(const Duration(days: 7)),
      EventListFilter.esteMes => DateTime(
        now.year,
        now.month + 1,
        0,
        23,
        59,
        59,
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (_status == _EventsStatus.loading) {
      return ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          _buildHeader(context),
          const SizedBox(height: 16),
          _buildFilterChips(),
          const SizedBox(height: 96),
          const Center(child: LoadingSpinner()),
        ],
      );
    }

    if (_status == _EventsStatus.error) {
      return ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          _buildHeader(context),
          const SizedBox(height: 16),
          _buildFilterChips(),
          EmptyState(
            icon: Icons.wifi_off_outlined,
            title: 'Nao foi possivel carregar os eventos',
            subtitle: 'Verifique sua conexao e tente novamente.',
            buttonLabel: 'Tentar novamente',
            onButtonTap: _loadEvents,
          ),
        ],
      );
    }

    if (_status == _EventsStatus.empty) {
      return RefreshIndicator(
        color: const Color(0xFF006733),
        onRefresh: () => _loadEvents(refresh: true),
        child: ListView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            _buildHeader(context),
            const SizedBox(height: 16),
            _buildFilterChips(),
            EmptyState(
              icon: Icons.event_busy_outlined,
              title: 'Nenhum evento encontrado',
              subtitle:
                  'Quando houver eventos para sua cidade, eles aparecerao aqui.',
              buttonLabel: 'Atualizar',
              onButtonTap: () => _loadEvents(refresh: true),
            ),
          ],
        ),
      );
    }

    return _buildLoadedList();
  }

  Widget _buildLoadedList() {
    final featured = _events.first;
    final thisWeek = _events
        .where((event) => event.id != featured.id)
        .take(2)
        .toList();
    final showThisWeekSection =
        _filter != EventListFilter.estaSemana && thisWeek.isNotEmpty;
    final showFooter =
        _status == _EventsStatus.loadingMore ||
        _status == _EventsStatus.errorMore;

    return RefreshIndicator(
      color: const Color(0xFF006733),
      onRefresh: () => _loadEvents(refresh: true),
      child: ListView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          _buildHeader(context),
          const SizedBox(height: 16),
          _buildFilterChips(),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: EventFeaturedBanner(
              event: featured,
              onTap: () => context.push(featured.detailRoute),
            ),
          ),
          if (showThisWeekSection) ...[
            const SizedBox(height: 16),
            SectionHeader(
              title: 'Esta semana',
              actionLabel: 'Ver tudo',
              onActionTap: () => _setFilter(EventListFilter.estaSemana),
            ),
            SizedBox(
              height: 220,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    for (var i = 0; i < thisWeek.length; i++) ...[
                      if (i > 0) const SizedBox(width: 12),
                      EventWeekCard(
                        event: thisWeek[i],
                        onTap: () => context.push(thisWeek[i].detailRoute),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
          SectionHeader(
            title:
                _filter == EventListFilter.todos ||
                    _filter == EventListFilter.proximos
                ? 'Todos os eventos'
                : 'Resultados',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                for (final event in _events)
                  EventListCard(
                    event: event,
                    onTap: () => context.push(event.detailRoute),
                  ),
              ],
            ),
          ),
          if (showFooter)
            _status == _EventsStatus.loadingMore
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: LoadingSpinner()),
                  )
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextButton(
                      onPressed: _loadMore,
                      child: const Text('Tentar carregar mais'),
                    ),
                  ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final cityName = _activeCityName;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (cityName == null || cityName.isEmpty
                          ? 'Sua cidade'
                          : cityName)
                      .toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF006733),
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Eventos',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            key: const Key('events_search_button'),
            onPressed: () =>
                context.push('${AppRoutes.search}?category=events'),
            icon: const Icon(Icons.search, color: Colors.black87),
          ),
          IconButton(
            onPressed: () => context.push(AppRoutes.search),
            icon: const Icon(Icons.tune, color: Colors.black87),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          AppChip(
            label: 'Todos',
            isSelected:
                _filter == EventListFilter.todos ||
                _filter == EventListFilter.proximos,
            onTap: () => _setFilter(EventListFilter.todos),
          ),
          const SizedBox(width: 8),
          AppChip(
            label: 'Hoje',
            isSelected: _filter == EventListFilter.hoje,
            onTap: () => _setFilter(EventListFilter.hoje),
          ),
          const SizedBox(width: 8),
          AppChip(
            label: 'Esta semana',
            isSelected: _filter == EventListFilter.estaSemana,
            onTap: () => _setFilter(EventListFilter.estaSemana),
          ),
          const SizedBox(width: 8),
          AppChip(
            label: 'Este mês',
            isSelected: _filter == EventListFilter.esteMes,
            onTap: () => _setFilter(EventListFilter.esteMes),
          ),
        ],
      ),
    );
  }
}
