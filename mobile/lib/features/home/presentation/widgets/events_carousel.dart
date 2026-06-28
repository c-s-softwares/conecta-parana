import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../events/domain/entities/event_list_item.dart';
import '../../../events/presentation/widgets/event_week_card.dart';

class EventsCarousel extends StatelessWidget {
  final List<EventListItem> events;

  const EventsCarousel({super.key, required this.events});

  @override
  Widget build(BuildContext context) {
    final visibleEvents = events.take(3).toList(growable: false);

    return SizedBox(
      height: 190,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            for (var i = 0; i < visibleEvents.length; i++) ...[
              if (i > 0) const SizedBox(width: 12),
              EventWeekCard(
                event: visibleEvents[i],
                compact: true,
                onTap: () => context.push(visibleEvents[i].detailRoute),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
