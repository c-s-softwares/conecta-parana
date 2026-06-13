import 'package:flutter/material.dart';
import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:go_router/go_router.dart';

class EventInfoCards extends StatelessWidget {
  final EventDetail event;

  const EventInfoCards({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    final dateLabel = _formatDate(event.eventDate);
    final timeLabel = _formatTime(event.eventDate, event.eventEndDate);
    final localName = event.local?.name;
    final entrance = event.entranceInfo;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _InfoCard(
                icon: Icons.calendar_today_outlined,
                label: 'DATA',
                value: dateLabel,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _InfoCard(
                icon: Icons.schedule_outlined,
                label: 'HORÁRIO',
                value: timeLabel,
              ),
            ),
          ],
        ),
        if (localName != null || entrance != null) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              if (localName != null)
                Expanded(
                  child: GestureDetector(
                    onTap: event.local != null
                        ? () => context.push('/map/${event.local!.id}')
                        : null,
                    child: _InfoCard(
                      icon: Icons.place_outlined,
                      label: 'LOCAL',
                      value: localName,
                      valueColor: event.local != null
                          ? const Color(0xFF006733)
                          : null,
                    ),
                  ),
                ),
              if (localName != null && entrance != null)
                const SizedBox(width: 10),
              if (entrance != null)
                Expanded(
                  child: _InfoCard(
                    icon: Icons.person_outline,
                    label: 'ENTRADA',
                    value: entrance,
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }

  String _formatDate(DateTime d) {
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    return '${d.day} de ${months[d.month - 1]} · ${d.year}';
  }

  String _formatTime(DateTime start, DateTime? end) {
    String hm(DateTime dt) =>
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    if (end == null) return hm(start);
    return '${hm(start)} – ${hm(end)}';
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoCard({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 13, color: const Color(0xFF888888)),
              const SizedBox(width: 4),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF888888),
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: valueColor ?? const Color(0xFF1A1A1A),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
