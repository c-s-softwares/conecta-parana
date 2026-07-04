import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/misc/avatar.dart';
import 'package:conectaparana/shared/widgets/misc/badge.dart';
import '../../domain/entities/suggestion.dart';
import 'package:conectaparana/core/formatters/app_date_formatter.dart';

class SuggestionListItem extends StatefulWidget {
  const SuggestionListItem({super.key, required this.suggestion});

  final Suggestion suggestion;

  @override
  State<SuggestionListItem> createState() => _SuggestionListItemState();
}

class _SuggestionListItemState extends State<SuggestionListItem> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.suggestion;
    final (label, variant) = _badgeFor(s.status);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _expanded ? const Color(0xFF1B8A50) : const Color(0xFFEDEDED),
          width: _expanded ? 1.5 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => setState(() => _expanded = !_expanded),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        s.category,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9E9E9E),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    AppBadge(label: label, variant: variant),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  s.subject,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Enviada ${AppDateFormatter.dayMonth(s.createdAt)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9E9E9E),
                        ),
                      ),
                    ),
                    if (_expanded)
                      const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Fechar',
                            style: TextStyle(
                              color: Color(0xFF006733),
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                          SizedBox(width: 2),
                          Icon(
                            Icons.keyboard_arrow_up,
                            size: 18,
                            color: Color(0xFF006733),
                          ),
                        ],
                      ),
                  ],
                ),
                if (_expanded) ...[
                  const SizedBox(height: 14),
                  Text(
                    s.message,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.5,
                      color: Color(0xFF3D3D3D),
                    ),
                  ),
                  if (s.reply != null) ...[
                    const SizedBox(height: 14),
                    _ReplyBlock(reply: s.reply!),
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  (String, AppBadgeVariant) _badgeFor(SuggestionStatus status) {
    switch (status) {
      case SuggestionStatus.respondida:
        return ('Respondida', AppBadgeVariant.green);
      case SuggestionStatus.enviada:
        return ('Enviada', AppBadgeVariant.teal);
      case SuggestionStatus.lida:
        return ('Lida', AppBadgeVariant.neutral);
      case SuggestionStatus.arquivada:
        return ('Arquivada', AppBadgeVariant.neutral);
      case SuggestionStatus.concluida:
        return ('Concluída', AppBadgeVariant.green);
    }
  }
}

class _ReplyBlock extends StatelessWidget {
  const _ReplyBlock({required this.reply});

  final SuggestionReply reply;

  @override
  Widget build(BuildContext context) {
    final displayName =
        reply.authorName?.trim().isNotEmpty == true
            ? reply.authorName!
            : 'Equipe responsável';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8F7),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Avatar(size: 30, name: reply.authorName),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      AppDateFormatter.shortDateTime(reply.date),
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF9E9E9E),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            reply.message,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
              color: Color(0xFF3D3D3D),
            ),
          ),
        ],
      ),
    );
  }
}
