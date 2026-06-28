import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../data/engagement_service.dart';
import '../../favorites/data/favorites_change_notifier.dart';

class EngagementBar extends StatefulWidget {
  const EngagementBar({
    super.key,
    required this.entityType,
    required this.entityId,
    required this.liked,
    required this.saved,
    required this.likesCount,
    required this.service,
    this.shareCount,
    this.onLikeChanged,
    this.onSavedChanged,
    this.onShare,
  });

  final String entityType;
  final String entityId;
  final bool liked;
  final bool saved;
  final int likesCount;
  final int? shareCount;
  final EngagementService service;
  final ValueChanged<bool>? onLikeChanged;
  final ValueChanged<bool>? onSavedChanged;
  final Future<void> Function(String text)? onShare;

  @override
  State<EngagementBar> createState() => _EngagementBarState();
}

class _EngagementBarState extends State<EngagementBar> {
  late bool _liked;
  late bool _saved;
  late int _likesCount;

  bool _isLiking = false;
  bool _isSaving = false;

  bool get _showLike => widget.entityType != 'local';

  @override
  void initState() {
    super.initState();
    _liked = widget.liked;
    _saved = widget.saved;
    _likesCount = widget.likesCount;
  }

  @override
  void didUpdateWidget(covariant EngagementBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_isLiking &&
        (oldWidget.liked != widget.liked ||
            oldWidget.likesCount != widget.likesCount)) {
      _liked = widget.liked;
      _likesCount = widget.likesCount;
    }
    if (!_isSaving && oldWidget.saved != widget.saved) {
      _saved = widget.saved;
    }
  }

  Future<void> _toggleLike() async {
    if (_isLiking) return;

    final previousLiked = _liked;
    final previousLikesCount = _likesCount;

    setState(() {
      _isLiking = true;
      _liked = !_liked;
      _likesCount += _liked ? 1 : -1;
    });

    widget.onLikeChanged?.call(_liked);

    try {
      await widget.service.toggleLike(
        entityType: widget.entityType,
        entityId: widget.entityId,
      );
    } catch (e) {
      setState(() {
        _liked = previousLiked;
        _likesCount = previousLikesCount;
      });

      widget.onLikeChanged?.call(_liked);

      if (e is EngagementException) {
        _showSnackBar(e.message);
      } else {
        _showSnackBar('Sem conexão. Tente novamente.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLiking = false;
        });
      }
    }
  }

  Future<void> _toggleSaved() async {
    if (_isSaving) return;

    final previousSaved = _saved;

    setState(() {
      _isSaving = true;
      _saved = !_saved;
    });

    widget.onSavedChanged?.call(_saved);

    try {
      await widget.service.toggleFavorite(
        entityType: widget.entityType,
        entityId: widget.entityId,
      );
      favoritesChangeNotifier.notifyChanged();
    } catch (e) {
      setState(() {
        _saved = previousSaved;
      });

      widget.onSavedChanged?.call(_saved);

      if (e is EngagementException) {
        _showSnackBar(e.message);
      } else {
        _showSnackBar('Sem conexão. Tente novamente.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _share() async {
    try {
      final url =
          'https://conectaparana.app/share/${widget.entityType}/${widget.entityId}';

      final text = 'Confira no Conecta Paraná: $url';

      if (widget.onShare != null) {
        await widget.onShare!(text);
        return;
      }

      await Share.share(text);
    } catch (_) {
      _showSnackBar('Compartilhamento não disponível.');
    }
  }

  void _showSnackBar(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return EngagementActions(
      liked: _liked,
      saved: _saved,
      likesCount: _likesCount,
      showLike: _showLike,
      likeLoading: _isLiking,
      saveLoading: _isSaving,
      shareCount: widget.shareCount,
      onLike: _toggleLike,
      onSave: _toggleSaved,
      onShare: _share,
    );
  }
}

class EngagementActions extends StatelessWidget {
  const EngagementActions({
    super.key,
    required this.liked,
    required this.saved,
    required this.likesCount,
    required this.onLike,
    required this.onSave,
    required this.onShare,
    this.showLike = true,
    this.likeLoading = false,
    this.saveLoading = false,
    this.shareCount,
  });

  final bool liked;
  final bool saved;
  final int likesCount;
  final bool showLike;
  final bool likeLoading;
  final bool saveLoading;
  final int? shareCount;
  final VoidCallback onLike;
  final VoidCallback onSave;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        if (showLike)
          _EngagementActionButton(
            key: const Key('engagement_like'),
            icon: liked ? Icons.favorite : Icons.favorite_border,
            label: '$likesCount',
            color: liked ? const Color(0xFFE53935) : const Color(0xFF555555),
            isLoading: likeLoading,
            onTap: onLike,
          ),
        _EngagementActionButton(
          key: const Key('engagement_save'),
          icon: saved ? Icons.bookmark : Icons.bookmark_border,
          label: 'Salvar',
          color: saved ? const Color(0xFF006733) : const Color(0xFF555555),
          isLoading: saveLoading,
          onTap: onSave,
        ),
        _EngagementActionButton(
          key: const Key('engagement_share'),
          icon: Icons.share_outlined,
          label: shareCount == null ? 'Compartilhar' : '$shareCount',
          color: const Color(0xFF555555),
          isLoading: false,
          onTap: onShare,
        ),
      ],
    );
  }
}

class _EngagementActionButton extends StatelessWidget {
  const _EngagementActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.isLoading,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final bool isLoading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
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
