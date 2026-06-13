import 'package:flutter/material.dart';

class EngagementWidget extends StatelessWidget {
  final int likesCount;
  final bool likedByMe;
  final bool savedByMe;
  final bool isLikeLoading;
  final bool isSaveLoading;
  final VoidCallback onLike;
  final VoidCallback onSave;
  final VoidCallback onShare;

  const EngagementWidget({
    super.key,
    required this.likesCount,
    required this.likedByMe,
    required this.savedByMe,
    required this.isLikeLoading,
    required this.isSaveLoading,
    required this.onLike,
    required this.onSave,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _EngagementButton(
          key: const Key('engagement_like'),
          icon: likedByMe ? Icons.favorite : Icons.favorite_border,
          iconColor: likedByMe ? const Color(0xFFE53935) : Colors.grey,
          label: likesCount > 0 ? '$likesCount' : null,
          isLoading: isLikeLoading,
          semanticsLabel: likedByMe ? 'Descurtir evento' : 'Curtir evento',
          onTap: onLike,
        ),
        const SizedBox(width: 8),

        _EngagementButton(
          key: const Key('engagement_save'),
          icon: savedByMe ? Icons.bookmark : Icons.bookmark_border,
          iconColor: savedByMe ? const Color(0xFF006733) : Colors.grey,
          label: null,
          isLoading: isSaveLoading,
          semanticsLabel: savedByMe ? 'Remover dos salvos' : 'Salvar evento',
          onTap: onSave,
        ),
        const SizedBox(width: 8),

        _EngagementButton(
          key: const Key('engagement_share'),
          icon: Icons.share_outlined,
          iconColor: Colors.grey,
          label: null,
          isLoading: false,
          semanticsLabel: 'Compartilhar evento',
          onTap: onShare,
        ),
      ],
    );
  }
}

class _EngagementButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String? label;
  final bool isLoading;
  final String semanticsLabel;
  final VoidCallback onTap;

  const _EngagementButton({
    super.key,
    required this.icon,
    required this.iconColor,
    this.label,
    required this.isLoading,
    required this.semanticsLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticsLabel,
      button: true,
      child: InkWell(
        onTap: isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isLoading)
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: iconColor,
                  ),
                )
              else
                Icon(icon, color: iconColor, size: 22),
              if (label != null) ...[
                const SizedBox(width: 4),
                Text(
                  label!,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: iconColor,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
