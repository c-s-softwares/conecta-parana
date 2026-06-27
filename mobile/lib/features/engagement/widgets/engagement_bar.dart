import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../data/engagement_service.dart';

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
    return Row(
      children: [
        if (_showLike) ...[
          _EngagementButton(
            icon: _liked ? Icons.favorite : Icons.favorite_border,
            label: '$_likesCount',
            onTap: _toggleLike,
          ),
          const SizedBox(width: 8),
        ],
        _EngagementButton(
          icon: _saved ? Icons.bookmark : Icons.bookmark_border,
          label: 'Salvar',
          onTap: _toggleSaved,
        ),
        const SizedBox(width: 8),
        _EngagementButton(
          icon: Icons.share_outlined,
          label: widget.shareCount?.toString() ?? '',
          onTap: _share,
        ),
      ],
    );
  }
}

class _EngagementButton extends StatelessWidget {
  const _EngagementButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;

    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.35)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
    );
  }
}
