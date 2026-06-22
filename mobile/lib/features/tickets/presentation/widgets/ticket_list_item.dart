import 'package:flutter/material.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/presentation/widgets/ticket_ui_mapper.dart';
import 'package:conectaparana/shared/widgets/misc/badge.dart'
    show AppBadgeVariant;

class TicketListItem extends StatelessWidget {
  final Ticket ticket;
  final VoidCallback? onTap;

  const TicketListItem({super.key, required this.ticket, this.onTap});

  @override
  Widget build(BuildContext context) {
    final statusLabel = TicketUiMapper.statusLabel(ticket.status);
    final sentDate = TicketUiMapper.formatShortDate(ticket.createdAt);
    final updatedRelative = TicketUiMapper.formatRelative(ticket.updatedAt);

    return Semantics(
      label:
          '${TicketUiMapper.typeLabel(ticket.type)}, ticket ${ticket.displayNumber}, '
          '${ticket.title}, status $statusLabel, '
          'enviado em $sentDate, atualizado há $updatedRelative',
      button: onTap != null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 4,
                  decoration: BoxDecoration(
                    color: TicketUiMapper.typeColor(ticket.type),
                    borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(12),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Wrap(
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Text(
                                    TicketUiMapper.typeLabel(
                                      ticket.type,
                                    ).toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: TicketUiMapper.typeColor(
                                        ticket.type,
                                      ),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                    ),
                                    child: Text(
                                      '·',
                                      style: TextStyle(
                                        color: Colors.grey.shade400,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    ticket.displayNumber,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            _StatusBadge(status: ticket.status),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          ticket.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Icon(
                              Icons.access_time,
                              size: 14,
                              color: Colors.grey.shade500,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Enviado $sentDate',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              'Atualizado $updatedRelative',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final label = TicketUiMapper.statusLabel(status);
    final variant = TicketUiMapper.statusVariant(status);
    final colors = _badgeColors(variant);

    return Semantics(
      label: label,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: colors.background,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: colors.text,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: colors.text,
              ),
            ),
          ],
        ),
      ),
    );
  }

  ({Color background, Color text}) _badgeColors(AppBadgeVariant variant) {
    switch (variant) {
      case AppBadgeVariant.purple:
        return (
          background: const Color(0xFFEDE7F6),
          text: const Color(0xFF7E57C2),
        );
      case AppBadgeVariant.orange:
        return (
          background: const Color(0xFFFFF3E0),
          text: const Color(0xFFD4820A),
        );
      case AppBadgeVariant.teal:
        return (
          background: const Color(0xFFE0F2F1),
          text: const Color(0xFF2A7A7A),
        );
      case AppBadgeVariant.green:
        return (
          background: const Color(0xFFFFF0EE),
          text: const Color(0xFF006733),
        );
      case AppBadgeVariant.blue:
        return (
          background: const Color(0xFFE3F2FD),
          text: const Color(0xFF1565C0),
        );
      case AppBadgeVariant.red:
        return (
          background: const Color(0xFFFFEBEE),
          text: const Color(0xFFE53935),
        );
      case AppBadgeVariant.grey:
        return (
          background: const Color(0xFFF5F5F5),
          text: const Color(0xFF616161),
        );
      case AppBadgeVariant.neutral:
        throw UnimplementedError();
    }
  }
}
