import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:conectaparana/features/events/presentation/pages/photo_viewer_page.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_info_cards.dart';
import 'package:conectaparana/features/events/presentation/widgets/event_static_map.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';

enum _PageState { loading, loaded, error, notFound }

class EventDetailPage extends StatefulWidget {
  final String eventId;
  final EventRepository? repository;

  const EventDetailPage({super.key, required this.eventId, this.repository});

  @override
  State<EventDetailPage> createState() => _EventDetailPageState();
}

class _EventDetailPageState extends State<EventDetailPage> {
  late final EventRepository _repository;

  _PageState _state = _PageState.loading;
  EventDetail? _event;
  bool _likeLoading = false;
  bool _saveLoading = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RemoteEventRepository();
    _loadEvent();
  }

  Future<void> _loadEvent() async {
    setState(() => _state = _PageState.loading);
    try {
      final event = await _repository.getEvent(widget.eventId);
      if (mounted) {
        setState(() {
          _event = event;
          _state = _PageState.loaded;
        });
      }
    } on DioException catch (e) {
      if (!mounted) return;
      setState(
        () => _state = e.response?.statusCode == 404
            ? _PageState.notFound
            : _PageState.error,
      );
    } catch (_) {
      if (mounted) setState(() => _state = _PageState.error);
    }
  }

  Future<void> _handleLike() async {
    if (_likeLoading || _event == null) return;
    setState(() => _likeLoading = true);
    try {
      final result = await _repository.toggleLike(widget.eventId);
      if (mounted) {
        setState(() {
          _event = _event!.copyWith(
            likedByMe: result.active,
            likesCount:
                result.count ?? _event!.likesCount + (result.active ? 1 : -1),
          );
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _likeLoading = false);
    }
  }

  Future<void> _handleSave() async {
    if (_saveLoading || _event == null) return;
    setState(() => _saveLoading = true);
    try {
      final result = await _repository.toggleFavorite(widget.eventId);
      if (mounted) {
        setState(() {
          _event = _event!.copyWith(savedByMe: result.active);
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _saveLoading = false);
    }
  }

  void _handleShare() {
    if (_event == null) return;
    Share.share('${_event!.title}\n\nVeja este evento no Conecta Paraná!');
  }

  @override
  Widget build(BuildContext context) {
    return switch (_state) {
      _PageState.loading => const Scaffold(
        body: Center(child: LoadingSpinner()),
      ),
      _PageState.notFound => _buildError(notFound: true),
      _PageState.error => _buildError(notFound: false),
      _PageState.loaded => _buildLoaded(),
    };
  }

  Widget _buildError({required bool notFound}) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.pop()),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: EmptyState(
        icon: notFound ? Icons.event_busy_outlined : Icons.wifi_off_outlined,
        title: notFound ? 'Evento não encontrado' : 'Não foi possível carregar',
        subtitle: notFound
            ? 'Este evento não existe ou foi removido.'
            : 'Verifique sua conexão e tente novamente.',
        buttonLabel: notFound ? 'Voltar' : 'Tentar novamente',
        onButtonTap: notFound ? () => context.pop() : _loadEvent,
      ),
    );
  }

  Widget _buildLoaded() {
    final event = _event!;
    final isCanceled = event.status.toLowerCase() == 'cancelado';
    final hasPhotos = event.photos.isNotEmpty;

    return Scaffold(
      backgroundColor: Colors.white,
      bottomNavigationBar: _BottomBar(
        event: event,
        likeLoading: _likeLoading,
        saveLoading: _saveLoading,
        onLike: _handleLike,
        onSave: _handleSave,
        onShare: _handleShare,
      ),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 220,
            backgroundColor: const Color(0xFF8B1A1A),
            surfaceTintColor: Colors.transparent,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: _CircleIconButton(
                icon: Icons.chevron_left,
                onTap: () => context.pop(),
              ),
            ),
            actions: [
              _CircleIconButton(
                icon: event.savedByMe ? Icons.bookmark : Icons.bookmark_border,
                onTap: _handleSave,
              ),
              const SizedBox(width: 4),
              _CircleIconButton(
                icon: Icons.share_outlined,
                onTap: _handleShare,
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: _EventHeader(event: event, hasPhotos: hasPhotos),
            ),
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isCanceled)
                  Container(
                    width: double.infinity,
                    color: const Color(0xFFE53935),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          Icons.cancel_outlined,
                          color: Colors.white,
                          size: 16,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Evento cancelado',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _TypeBadge(label: event.type),
                      const SizedBox(height: 14),

                      EventInfoCards(event: event),
                      const SizedBox(height: 24),

                      const Text(
                        'Sobre o evento',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        event.description,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF555555),
                          height: 1.6,
                        ),
                      ),

                      if (event.coordinates != null) ...[
                        const SizedBox(height: 20),
                        EventStaticMap(
                          coordinates: event.coordinates!,
                          localName: event.local?.name,
                        ),
                      ],

                      const SizedBox(height: 24),
                    ],
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

class _EventHeader extends StatefulWidget {
  final EventDetail event;
  final bool hasPhotos;

  const _EventHeader({required this.event, required this.hasPhotos});

  @override
  State<_EventHeader> createState() => _EventHeaderState();
}

class _EventHeaderState extends State<_EventHeader> {
  final _pageController = PageController();
  int _currentIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (widget.hasPhotos)
          _PhotosBackground(
            photos: widget.event.photos,
            pageController: _pageController,
            onPageChanged: (i) => setState(() => _currentIndex = i),
            currentIndex: _currentIndex,
          )
        else
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [Color(0xFFB71C1C), Color(0xFF4A0404)],
              ),
            ),
          ),

        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 130,
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.black87, Colors.transparent],
              ),
            ),
          ),
        ),

        Positioned(
          left: 16,
          right: 16,
          bottom: 16,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.event.title,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  height: 1.25,
                  shadows: [Shadow(color: Colors.black54, blurRadius: 8)],
                ),
              ),
              if (widget.hasPhotos && widget.event.photos.length > 1) ...[
                const SizedBox(height: 10),
                Row(
                  children: List.generate(widget.event.photos.length, (i) {
                    final active = i == _currentIndex;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(right: 5),
                      width: active ? 18 : 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: active ? Colors.white : Colors.white38,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    );
                  }),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _PhotosBackground extends StatelessWidget {
  final List<EventPhoto> photos;
  final PageController pageController;
  final ValueChanged<int> onPageChanged;
  final int currentIndex;

  const _PhotosBackground({
    required this.photos,
    required this.pageController,
    required this.onPageChanged,
    required this.currentIndex,
  });

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: pageController,
      onPageChanged: onPageChanged,
      itemCount: photos.length,
      itemBuilder: (context, index) {
        final photo = photos[index];
        return GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  PhotoViewerPage(photos: photos, initialIndex: index),
            ),
          ),
          child: Image.network(
            photo.thumbUrl ?? photo.url,
            fit: BoxFit.cover,
            // ignore: unnecessary_underscores
            errorBuilder: (_, __, ___) => Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [Color(0xFFB71C1C), Color(0xFF4A0404)],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String label;

  const _TypeBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF006733),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Colors.white,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Icon(icon, color: const Color(0xFF1A1A1A), size: 18),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final EventDetail event;
  final bool likeLoading;
  final bool saveLoading;
  final VoidCallback onLike;
  final VoidCallback onSave;
  final VoidCallback onShare;

  const _BottomBar({
    required this.event,
    required this.likeLoading,
    required this.saveLoading,
    required this.onLike,
    required this.onSave,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      color: Colors.white,
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + bottomPadding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () {
              },
              icon: const Icon(Icons.calendar_month_outlined, size: 18),
              label: const Text(
                'Adicionar à agenda',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006733),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _ActionButton(
                key: const Key('engagement_like'),
                icon: event.likedByMe ? Icons.favorite : Icons.favorite_border,
                label: '${event.likesCount}',
                color: event.likedByMe
                    ? const Color(0xFFE53935)
                    : const Color(0xFF555555),
                isLoading: likeLoading,
                onTap: onLike,
              ),
              _ActionButton(
                key: const Key('engagement_save'),
                icon: event.savedByMe ? Icons.bookmark : Icons.bookmark_border,
                label: 'Salvar',
                color: event.savedByMe
                    ? const Color(0xFF006733)
                    : const Color(0xFF555555),
                isLoading: saveLoading,
                onTap: onSave,
              ),
              _ActionButton(
                key: const Key('engagement_share'),
                icon: Icons.share_outlined,
                label: 'Compartilhar',
                color: const Color(0xFF555555),
                isLoading: false,
                onTap: onShare,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isLoading;
  final VoidCallback onTap;

  const _ActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: color),
              )
            else
              Icon(icon, size: 18, color: color),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
