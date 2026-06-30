import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/communicates/data/communicate_detail_model.dart';
import 'package:conectaparana/features/communicates/data/communicate_repository.dart';
import 'package:conectaparana/features/communicates/presentation/widgets/communicate_detail_widgets.dart';
import 'package:conectaparana/features/communicates/presentation/widgets/communicate_photo_carousel.dart';
import 'package:conectaparana/features/engagement/data/engagement_service.dart';
import 'package:conectaparana/features/engagement/widgets/engagement_bar.dart';
import 'package:conectaparana/features/favorites/data/favorites_change_notifier.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

enum _CommunicatePageState { loading, loaded, notFound, error }

class CommunicateDetailPage extends StatefulWidget {
  const CommunicateDetailPage({
    super.key,
    required this.communicateId,
    this.repository,
    this.engagementService,
    this.onShare,
  });

  final String communicateId;
  final CommunicateRepository? repository;
  final EngagementService? engagementService;
  final Future<void> Function(String text)? onShare;

  @override
  State<CommunicateDetailPage> createState() => _CommunicateDetailPageState();
}

class _CommunicateDetailPageState extends State<CommunicateDetailPage> {
  late final CommunicateRepository _repository =
      widget.repository ?? CommunicateRepository();
  late final EngagementService _engagementService =
      widget.engagementService ?? EngagementService(ApiClient.instance.dio);

  _CommunicatePageState _state = _CommunicatePageState.loading;
  CommunicateDetailModel? _item;
  bool _liked = false;
  bool _saved = false;
  int _likesCount = 0;
  bool _likeLoading = false;
  bool _saveLoading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _state = _CommunicatePageState.loading);
    try {
      final item = await _repository.getById(widget.communicateId);
      if (!mounted) return;
      setState(() {
        _item = item;
        _liked = item.liked;
        _saved = item.saved;
        _likesCount = item.likesCount;
        _state = _CommunicatePageState.loaded;
      });
    } on CommunicateNotFoundException {
      if (mounted) setState(() => _state = _CommunicatePageState.notFound);
    } catch (_) {
      if (mounted) setState(() => _state = _CommunicatePageState.error);
    }
  }

  Future<void> _toggleLike() async {
    if (_likeLoading || _item == null) return;
    final previousLiked = _liked;
    final previousCount = _likesCount;
    setState(() {
      _likeLoading = true;
      _liked = !_liked;
      _likesCount += _liked ? 1 : -1;
    });

    try {
      await _engagementService.toggleLike(
        entityType: 'communicate',
        entityId: _item!.id,
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _liked = previousLiked;
        _likesCount = previousCount;
      });
      _showConnectionError();
    } finally {
      if (mounted) setState(() => _likeLoading = false);
    }
  }

  Future<void> _toggleSaved() async {
    if (_saveLoading || _item == null) return;
    final previousSaved = _saved;
    setState(() {
      _saveLoading = true;
      _saved = !_saved;
    });

    try {
      await _engagementService.toggleFavorite(
        entityType: 'communicate',
        entityId: _item!.id,
      );
      favoritesChangeNotifier.notifyChanged();
    } catch (_) {
      if (!mounted) return;
      setState(() => _saved = previousSaved);
      _showConnectionError();
    } finally {
      if (mounted) setState(() => _saveLoading = false);
    }
  }

  Future<void> _share() async {
    final item = _item;
    if (item == null) return;
    final text =
        '${item.title}\n\nhttps://conectaparana.app/share/communicate/${item.id}';
    try {
      if (widget.onShare != null) {
        await widget.onShare!(text);
      } else {
        await Share.share(text);
      }
    } catch (_) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Compartilhamento não disponível.',
        variant: AppToastVariant.error,
      );
    }
  }

  void _showConnectionError() {
    AppToast.show(
      context,
      message: 'Sem conexão. Tente novamente.',
      variant: AppToastVariant.error,
    );
  }

  void _showComingSoon() {
    AppToast.show(
      context,
      message: 'Esta função estará disponível em breve!',
      variant: AppToastVariant.info,
    );
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = _item;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      bottomNavigationBar:
          _state == _CommunicatePageState.loaded && item != null
          ? _EngagementFooter(
              liked: _liked,
              saved: _saved,
              likesCount: _likesCount,
              shareCount: item.shareCount,
              likeLoading: _likeLoading,
              saveLoading: _saveLoading,
              onLike: _toggleLike,
              onSave: _toggleSaved,
              onShare: _share,
            )
          : null,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: CommunicateTopBar(
                saved: _saved,
                saveLoading: _saveLoading,
                showActions:
                    _state == _CommunicatePageState.loaded && item != null,
                onBack: _goBack,
                onSave: _toggleSaved,
                onShare: _share,
              ),
            ),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    return switch (_state) {
      _CommunicatePageState.loading => const Center(child: LoadingSpinner()),
      _CommunicatePageState.notFound => const EmptyState(
        icon: Icons.search_off_outlined,
        title: 'Comunicado não encontrado',
      ),
      _CommunicatePageState.error => EmptyState(
        icon: Icons.wifi_off_outlined,
        title: 'Não foi possível carregar',
        subtitle: 'Verifique sua conexão e tente novamente.',
        buttonLabel: 'Tentar novamente',
        onButtonTap: _load,
      ),
      _CommunicatePageState.loaded => _buildLoaded(_item!),
    };
  }

  Widget _buildLoaded(CommunicateDetailModel item) {
    final fallbackCity = AuthService.instance.currentUser.value?.cityName;

    return ListView(
      key: const Key('communicate_detail_scroll'),
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        if (item.photos.isNotEmpty)
          CommunicatePhotoCarousel(photos: item.photos)
        else
          CommunicateHeroCard(item: item, fallbackCityName: fallbackCity),
        const SizedBox(height: 16),
        CommunicateAuthorRow(item: item, onFollow: _showComingSoon),
        const SizedBox(height: 14),
        const Divider(height: 1, color: Color(0xFFDDE2E0)),
        if (item.highlights.isNotEmpty) ...[
          const SizedBox(height: 14),
          CommunicateHighlightsCard(items: item.highlights),
        ],
        const SizedBox(height: 14),
        for (final paragraph in item.paragraphs) ...[
          Text(
            paragraph,
            style: const TextStyle(
              color: Color(0xFF17201E),
              fontSize: 15.5,
              height: 1.58,
            ),
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 4),
        CommunicateAlertButton(onPressed: _showComingSoon),
      ],
    );
  }
}

class _EngagementFooter extends StatelessWidget {
  const _EngagementFooter({
    required this.liked,
    required this.saved,
    required this.likesCount,
    required this.shareCount,
    required this.likeLoading,
    required this.saveLoading,
    required this.onLike,
    required this.onSave,
    required this.onShare,
  });

  final bool liked;
  final bool saved;
  final int likesCount;
  final int? shareCount;
  final bool likeLoading;
  final bool saveLoading;
  final VoidCallback onLike;
  final VoidCallback onSave;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        color: const Color(0xFFF7F8FA),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Divider(height: 1, color: Color(0xFFDDE2E0)),
            const SizedBox(height: 10),
            EngagementActions(
              liked: liked,
              saved: saved,
              likesCount: likesCount,
              shareCount: shareCount,
              likeLoading: likeLoading,
              saveLoading: saveLoading,
              onLike: onLike,
              onSave: onSave,
              onShare: onShare,
            ),
          ],
        ),
      ),
    );
  }
}
