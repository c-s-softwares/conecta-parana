import 'package:conectaparana/features/communicates/data/communicate_detail_model.dart';
import 'package:conectaparana/core/formatters/app_date_formatter.dart';
import 'package:conectaparana/shared/widgets/misc/avatar.dart';
import 'package:flutter/material.dart';

const communicateGreen = Color(0xFF006B39);
const communicateDarkGreen = Color(0xFF005A30);

class CommunicateTopBar extends StatelessWidget {
  const CommunicateTopBar({
    super.key,
    required this.saved,
    required this.onBack,
    required this.onSave,
    required this.onShare,
    this.saveLoading = false,
    this.showActions = true,
  });

  final bool saved;
  final bool saveLoading;
  final bool showActions;
  final VoidCallback onBack;
  final VoidCallback onSave;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _CircleAction(
          key: const Key('communicate_back_button'),
          icon: Icons.chevron_left,
          tooltip: 'Voltar',
          onTap: onBack,
        ),
        const Spacer(),
        if (showActions) ...[
          _CircleAction(
            key: const Key('communicate_header_save'),
            icon: saved ? Icons.bookmark : Icons.bookmark_border,
            tooltip: saved ? 'Remover dos salvos' : 'Salvar',
            color: saved ? communicateGreen : const Color(0xFF17201E),
            loading: saveLoading,
            onTap: onSave,
          ),
          const SizedBox(width: 8),
          _CircleAction(
            key: const Key('communicate_header_share'),
            icon: Icons.share_outlined,
            tooltip: 'Compartilhar',
            onTap: onShare,
          ),
        ],
      ],
    );
  }
}

class CommunicateHeroCard extends StatelessWidget {
  const CommunicateHeroCard({
    super.key,
    required this.item,
    this.fallbackCityName,
  });

  final CommunicateDetailModel item;
  final String? fallbackCityName;

  @override
  Widget build(BuildContext context) {
    final cityName = _nonEmpty(item.cityName) ?? _nonEmpty(fallbackCityName);
    final location = cityName == null
        ? null
        : [
            cityName,
            if (_nonEmpty(item.stateCode) != null) item.stateCode!,
          ].join(', ');
    final date = item.createdAt == null
        ? null
        : AppDateFormatter.publication(item.createdAt!);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 17),
      decoration: BoxDecoration(
        color: communicateDarkGreen,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              const _HeroTag(
                label: 'COMUNICADO OFICIAL',
                backgroundColor: Colors.white,
                foregroundColor: communicateGreen,
              ),
              _HeroTag(
                label: (_nonEmpty(item.category) ?? 'Informativo'),
                backgroundColor: Colors.white.withValues(alpha: 0.14),
                foregroundColor: Colors.white,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 21,
              height: 1.08,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (location != null || date != null) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 18,
              runSpacing: 8,
              children: [
                if (location != null)
                  _HeroMetadata(
                    icon: Icons.location_on_outlined,
                    text: location,
                  ),
                if (date != null)
                  _HeroMetadata(icon: Icons.access_time, text: date),
              ],
            ),
          ],
        ],
      ),
    );
  }

  static String? _nonEmpty(String? value) {
    final normalized = value?.trim();
    return normalized == null || normalized.isEmpty ? null : normalized;
  }
}

class CommunicateAuthorRow extends StatelessWidget {
  const CommunicateAuthorRow({super.key, required this.item, this.onFollow});

  final CommunicateDetailModel item;
  final VoidCallback? onFollow;

  @override
  Widget build(BuildContext context) {
    final authorName = item.author?.name ?? 'Prefeitura Municipal';

    return Row(
      children: [
        Avatar(size: 40, name: item.author?.name),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authorName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF101918),
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _publishedLabel(item.createdAt),
                style: const TextStyle(
                  color: Color(0xFF747C79),
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        // OutlinedButton(
        //   key: const Key('communicate_follow_button'),
        //   onPressed: onFollow,
        //   style: OutlinedButton.styleFrom(
        //     foregroundColor: const Color(0xFF17201E),
        //     minimumSize: const Size(70, 34),
        //     padding: const EdgeInsets.symmetric(horizontal: 16),
        //     side: const BorderSide(color: Color(0xFFD7DEDB)),
        //     shape: RoundedRectangleBorder(
        //       borderRadius: BorderRadius.circular(20),
        //     ),
        //   ),
        //   child: const Text(
        //     'Seguir',
        //     style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        //   ),
        // ),
      ],
    );
  }

  static String _publishedLabel(DateTime? date) {
    if (date == null) return 'Publicação oficial';
    return 'Publicado em ${AppDateFormatter.publication(date)}';
  }
}

class CommunicateHighlightsCard extends StatelessWidget {
  const CommunicateHighlightsCard({super.key, required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const Key('communicate_highlights'),
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(15, 14, 15, 13),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F6F3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFB9D4C6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'O QUE MUDA',
            style: TextStyle(
              color: communicateGreen,
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          for (var index = 0; index < items.length; index++) ...[
            _BulletPoint(text: items[index]),
            if (index < items.length - 1) const SizedBox(height: 6),
          ],
        ],
      ),
    );
  }
}

class CommunicateAlertButton extends StatelessWidget {
  const CommunicateAlertButton({super.key, this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton.icon(
        key: const Key('communicate_alert_button'),
        onPressed: onPressed,
        icon: const Icon(Icons.notifications_none, size: 18),
        label: const Text('Ativar alerta desta secretaria'),
        style: ElevatedButton.styleFrom(
          backgroundColor: communicateGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}

class _CircleAction extends StatelessWidget {
  const _CircleAction({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.color = const Color(0xFF17201E),
    this.loading = false,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final Color color;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFEEF1F2),
      shape: const CircleBorder(),
      child: IconButton(
        tooltip: tooltip,
        onPressed: loading ? null : onTap,
        icon: loading
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: color),
              )
            : Icon(icon, color: color, size: 21),
      ),
    );
  }
}

class _HeroTag extends StatelessWidget {
  const _HeroTag({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foregroundColor,
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _HeroMetadata extends StatelessWidget {
  const _HeroMetadata({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.white.withValues(alpha: 0.85)),
        const SizedBox(width: 5),
        Text(
          text,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.85),
            fontSize: 11.5,
          ),
        ),
      ],
    );
  }
}

class _BulletPoint extends StatelessWidget {
  const _BulletPoint({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 4,
          height: 4,
          margin: const EdgeInsets.only(top: 7, right: 10),
          color: communicateGreen,
        ),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF075D37),
              fontSize: 13.5,
              height: 1.35,
            ),
          ),
        ),
      ],
    );
  }
}
