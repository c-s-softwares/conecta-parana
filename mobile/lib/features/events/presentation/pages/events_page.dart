import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:conectaparana/dev/fakes/fake_event_list.dart';
import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';
import 'package:conectaparana/shared/widgets/misc/app_chip.dart';
import 'package:conectaparana/shared/widgets/misc/section_header.dart';

import '../widgets/event_featured_banner.dart';
import '../widgets/event_list_card.dart';
import '../widgets/event_week_card.dart';

enum _EventFilter { todos, hoje, estaSemana, esteMes }

class EventsPage extends StatefulWidget {
  const EventsPage({super.key});

  @override
  State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> {
  _EventFilter _filter = _EventFilter.todos;

  @override
  Widget build(BuildContext context) {
    final featured = fakeEventListItems.firstWhere(
      (e) => e.isFeatured,
      orElse: () => fakeEventListItems.first,
    );

    final thisWeek = fakeEventListItems
        .where((e) => e.id != featured.id)
        .take(2)
        .toList();

    final allEvents = _filteredEvents();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            _buildHeader(context),
            const SizedBox(height: 16),
            _buildFilterChips(),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: EventFeaturedBanner(
                event: featured,
                onTap: () => context.push(featured.detailRoute),
              ),
            ),
            const SizedBox(height: 16),
            SectionHeader(
              title: 'Esta semana',
              actionLabel: 'Ver tudo',
              onActionTap: () {},
            ),
            SizedBox(
              height: 220,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    for (var i = 0; i < thisWeek.length; i++) ...[
                      if (i > 0) const SizedBox(width: 12),
                      EventWeekCard(
                        event: thisWeek[i],
                        onTap: () => context.push(thisWeek[i].detailRoute),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SectionHeader(title: 'Todos os eventos'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  for (final event in allEvents)
                    EventListCard(
                      event: event,
                      onTap: () => context.push(event.detailRoute),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MARINGÁ, PR',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF006733),
                    letterSpacing: 1,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Eventos',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.search, color: Colors.black87),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.tune, color: Colors.black87),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          AppChip(
            label: 'Todos',
            isSelected: _filter == _EventFilter.todos,
            onTap: () => setState(() => _filter = _EventFilter.todos),
          ),
          const SizedBox(width: 8),
          AppChip(
            label: 'Hoje',
            isSelected: _filter == _EventFilter.hoje,
            onTap: () => setState(() => _filter = _EventFilter.hoje),
          ),
          const SizedBox(width: 8),
          AppChip(
            label: 'Esta semana',
            isSelected: _filter == _EventFilter.estaSemana,
            onTap: () => setState(() => _filter = _EventFilter.estaSemana),
          ),
          const SizedBox(width: 8),
          AppChip(
            label: 'Este mês',
            isSelected: _filter == _EventFilter.esteMes,
            onTap: () => setState(() => _filter = _EventFilter.esteMes),
          ),
        ],
      ),
    );
  }

  List<EventListItem> _filteredEvents() {
    final now = DateTime.now();

    switch (_filter) {
      case _EventFilter.todos:
        return fakeEventListItems;
      case _EventFilter.hoje:
        return fakeEventListItems
            .where(
              (e) =>
                  e.date.year == now.year &&
                  e.date.month == now.month &&
                  e.date.day == now.day,
            )
            .toList();
      case _EventFilter.estaSemana:
        final weekEnd = now.add(const Duration(days: 7));
        return fakeEventListItems
            .where((e) => e.date.isBefore(weekEnd))
            .toList();
      case _EventFilter.esteMes:
        return fakeEventListItems
            .where(
              (e) => e.date.year == now.year && e.date.month == now.month,
            )
            .toList();
    }
  }
}
