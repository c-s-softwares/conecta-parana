import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../domain/entities/home_highlights.dart';

class EventsCarousel extends StatelessWidget {
  final List<HomeHighlightEvent> events;

  const EventsCarousel({super.key, required this.events});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 190,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            for (var i = 0; i < events.length; i++) ...[
              if (i > 0) const SizedBox(width: 12),
              _EventCard(
                event: events[i],
                onTap: () => context.push(events[i].detailRoute),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final HomeHighlightEvent event;
  final VoidCallback onTap;

  const _EventCard({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = event.gradientColors
        .map((c) => Color(int.parse(c)))
        .toList();

    return Semantics(
      label: event.title,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 220,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: colors,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (event.badgeLabel != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(38),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    event.badgeLabel!,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              const Spacer(),
              Text(
                event.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              if (event.badgeLabel == null) ...[
                Text(
                  event.dateLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
              ],
              Text(
                event.location,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withAlpha(220),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
