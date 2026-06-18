import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/auth_user.dart';
import 'package:conectaparana/core/router/app_router.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/section_header.dart';
import 'package:conectaparana/shared/widgets/navigation/app_header.dart';
import 'package:conectaparana/dev/fakes/fake_feed_repository.dart';
import 'package:conectaparana/dev/fakes/fake_home_highlights.dart';
import '../../data/repositories/feed_repository_impl.dart';
import '../../domain/repositories/feed_repository.dart';
import '../providers/feed_notifier.dart';
import '../widgets/alert_banner.dart';
import '../widgets/events_carousel.dart';
import '../widgets/feed_item_card.dart';
import '../widgets/feed_skeleton.dart';
import '../widgets/featured_banner_card.dart';
import '../widgets/home_greeting_header.dart';
import '../widgets/services_grid.dart';
import 'package:conectaparana/shared/widgets/misc/delayed_display.dart';

class HomePage extends StatefulWidget {
  final FeedNotifier? mockNotifier;

  const HomePage({super.key, this.mockNotifier});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late final FeedNotifier _notifier;
  final ScrollController _scrollController = ScrollController();
  bool _ready = false;

  static const int _notificationBadge = 3;

  @override
  void initState() {
    super.initState();

    if (widget.mockNotifier != null) {
      _notifier = widget.mockNotifier!;
      _scrollController.addListener(_onScroll);
      _notifier.addListener(_onStateChange);
      _ready = true;
      return;
    }

    _init();
  }

  FeedRepository _feedRepository() {
    if (kDebugMode) return const FakeFeedRepository();
    return FeedRepositoryImpl();
  }

  Future<void> _init() async {
    final user = AuthService.instance.currentUser.value;
    final cityId = user?.cityId;

    if (cityId == null || cityId.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go(AppRoutes.onboarding);
      });
      _notifier = FeedNotifier(repository: _feedRepository(), cityId: '');
      return;
    }

    double? lat;
    double? lng;
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse) {
      try {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.low,
          ),
        );
        lat = position.latitude;
        lng = position.longitude;
      } catch (_) {}
    }

    _notifier = FeedNotifier(
      repository: _feedRepository(),
      cityId: cityId,
      lat: lat,
      lng: lng,
    );

    _scrollController.addListener(_onScroll);
    _notifier.addListener(_onStateChange);
    if (mounted) setState(() => _ready = true);
    _notifier.load();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _notifier.removeListener(_onStateChange);
    if (widget.mockNotifier == null) _notifier.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final pos = _scrollController.position;
    if (pos.pixels >= pos.maxScrollExtent - 200) {
      _notifier.loadMore();
    }
  }

  void _onStateChange() {
    if (!mounted) return;
    final state = _notifier.value;

    if (state.redirectToOnboarding) {
      context.go(AppRoutes.onboarding);
      return;
    }

    if (state.status == FeedStatus.errorMore) {
      AppToast.show(
        context,
        message: 'Falha ao carregar mais. Toque para tentar novamente.',
        variant: AppToastVariant.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          children: [
            ValueListenableBuilder<AuthUser?>(
              valueListenable: AuthService.instance.currentUser,
              builder: (context, user, _) => AppHeader(
                cityName: user?.cityName ?? '',
                hasAlert: _notificationBadge > 0,
                onCityTap: () async {
                  final city = await context.push<City>(AppRoutes.onboarding);
                  if (city != null && mounted) {
                    final current = AuthService.instance.currentUser.value;
                    if (current != null) {
                      AuthService.instance.currentUser.value = AuthUser(
                        id: current.id,
                        role: current.role,
                        cityId: city.id,
                        cityName: city.name,
                      );
                    }
                  }
                },
                onNotificationTap: () {},
              ),
            ),
            Expanded(
              child: !_ready
                  ? const FeedSkeleton()
                  : ValueListenableBuilder<FeedState>(
                      valueListenable: _notifier,
                      builder: (context, state, _) => _buildBody(state),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(FeedState state) {
    switch (state.status) {
      case FeedStatus.initial:
      case FeedStatus.loading:
        return ListView(
          padding: EdgeInsets.zero,
          children: [
            ..._highlightSections(),
            const SectionHeader(title: 'Mais comunicados'),
            const DelayedDisplay(child: FeedSkeleton()),
          ],
        );

      case FeedStatus.empty:
        return ListView(
          padding: EdgeInsets.zero,
          children: [
            ..._highlightSections(),
            const SectionHeader(title: 'Mais comunicados'),
            EmptyState(
              icon: Icons.inbox_outlined,
              title: 'Nada por aqui ainda',
              subtitle:
                  'Assim que houver novidades para sua cidade, elas aparecerão aqui.',
              buttonLabel: 'Atualizar',
              onButtonTap: _notifier.refresh,
            ),
          ],
        );

      case FeedStatus.errorFirst:
        return ListView(
          padding: EdgeInsets.zero,
          children: [
            ..._highlightSections(),
            const SectionHeader(title: 'Mais comunicados'),
            EmptyState(
              icon: Icons.cloud_off_outlined,
              title: 'Não foi possível carregar o feed.',
              subtitle: 'Verifique sua conexão e tente novamente.',
              buttonLabel: 'Tentar novamente',
              onButtonTap: _notifier.load,
            ),
          ],
        );

      case FeedStatus.success:
      case FeedStatus.refreshing:
      case FeedStatus.loadingMore:
      case FeedStatus.errorMore:
        return _buildFeedList(state);
    }
  }

  List<Widget> _highlightSections() {
    const highlights = fakeHomeHighlights;

    return [
      const HomeGreetingHeader(),
      if (highlights.alert != null) AlertBanner(alert: highlights.alert!),
      if (highlights.featuredBanner != null)
        FeaturedBannerCard(
          banner: highlights.featuredBanner!,
          onTap: () => context.push(highlights.featuredBanner!.detailRoute),
        ),
      const SectionHeader(title: 'Serviços', actionLabel: 'Todos'),
      ServicesGrid(services: highlights.services),
      const SectionHeader(title: 'Eventos próximos', actionLabel: 'Ver tudo'),
      EventsCarousel(events: highlights.events),
      const SizedBox(height: 8),
    ];
  }

  Widget _buildFeedList(FeedState state) {
    final showFooter =
        state.status == FeedStatus.loadingMore ||
        state.status == FeedStatus.errorMore;

    final sections = _highlightSections();

    return RefreshIndicator(
      color: const Color(0xFF006733),
      onRefresh: _notifier.refresh,
      child: ListView.builder(
        key: const PageStorageKey('feed_list'),
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 24),
        // ignore: deprecated_member_use
        cacheExtent: 3000,
        itemCount:
            sections.length + 1 + state.items.length + (showFooter ? 1 : 0),
        itemBuilder: (context, index) {
          if (index < sections.length) {
            return sections[index];
          }

          if (index == sections.length) {
            return const SectionHeader(
              title: 'Mais comunicados',
              actionLabel: 'Ver tudo',
            );
          }

          final itemIndex = index - sections.length - 1;

          if (itemIndex < state.items.length) {
            final item = state.items[itemIndex];
            return FeedItemCard(
              key: ValueKey(item.id),
              item: item,
              onTap: () => context.push(item.detailRoute),
            );
          }

          if (state.status == FeedStatus.loadingMore) {
            return const _LoadingMoreFooter();
          }

          return _ErrorMoreFooter(onRetry: _notifier.loadMore);
        },
      ),
    );
  }
}

class _LoadingMoreFooter extends StatelessWidget {
  const _LoadingMoreFooter();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: CircularProgressIndicator(
          color: Color(0xFF006733),
          strokeWidth: 2,
        ),
      ),
    );
  }
}

class _ErrorMoreFooter extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorMoreFooter({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: GestureDetector(
        onTap: onRetry,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFE53935).withAlpha(20),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.refresh, size: 16, color: Color(0xFFE53935)),
              SizedBox(width: 8),
              Flexible(
                child: Text(
                  'Falha ao carregar mais. Toque para tentar novamente.',
                  style: TextStyle(fontSize: 13, color: Color(0xFFE53935)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
