import 'package:conectaparana/features/suggestions/data/repositories/remote_suggestion_repository.dart';
import 'package:conectaparana/shared/widgets/misc/list_state_view.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../domain/repositories/suggestion_repository.dart';
import '../providers/suggestions_notifier.dart';
import '../widgets/suggestion_list_item.dart';
import '../widgets/suggestions_skeleton.dart';

class SuggestionsPage extends StatefulWidget {
  const SuggestionsPage({super.key, this.mockNotifier});

  final SuggestionsNotifier? mockNotifier;

  @override
  State<SuggestionsPage> createState() => _SuggestionsPageState();
}

class _SuggestionsPageState extends State<SuggestionsPage> {
  late final SuggestionsNotifier _notifier;

  @override
  void initState() {
    super.initState();

    if (widget.mockNotifier != null) {
      _notifier = widget.mockNotifier!;
    } else {
      _notifier = SuggestionsNotifier(repository: _repository());
      _notifier.load();
    }
  }

  SuggestionRepository _repository() {
    return RemoteSuggestionRepository();
  }

  @override
  void dispose() {
    if (widget.mockNotifier == null) _notifier.dispose();
    super.dispose();
  }

  Future<void> _openNew() async {
    final created = await context.push<bool>('/profile/suggestions/new');

    if (!mounted) return;

    if (created == true) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Sugestão enviada')));

      await _notifier.refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F5F5),
        elevation: 0,
        scrolledUnderElevation: 0,
        toolbarHeight: 76,
        titleSpacing: 0,
        title: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'CIDADÃO',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: Color(0xFF006733),
              ),
            ),
            SizedBox(height: 2),
            Text(
              'Minhas Sugestões',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton.icon(
              onPressed: _openNew,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Nova'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006733),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
              ),
            ),
          ),
        ],
      ),
      body: ValueListenableBuilder<SuggestionsState>(
        valueListenable: _notifier,
        builder: (context, state, _) {
          return Column(
            children: [
              _FilterTabs(active: state.filter, onChanged: _notifier.setFilter),
              Expanded(
                child: ListStateView(
                  isLoading:
                      state.status == SuggestionsStatus.initial ||
                      state.status == SuggestionsStatus.loading,
                  hasError: state.status == SuggestionsStatus.error,
                  isEmpty: state.visibleItems.isEmpty,
                  hasActiveFilters:
                      state.hasActiveFilter && state.items.isNotEmpty,
                  onRetry: _notifier.load,
                  onClearFilters: () {
                    _notifier.setFilter(SuggestionFilter.all);
                  },
                  loadingSkeleton: const SuggestionsSkeleton(),
                  emptyIcon: Icons.lightbulb_outline,
                  emptyTitle: 'Você ainda não enviou sugestões.',
                  emptySubtitle:
                      'Tem uma ideia para a cidade? Envie sua primeira sugestão.',
                  emptyActionLabel: 'Enviar primeira sugestão',
                  onEmptyAction: _openNew,
                  builder: (context) => RefreshIndicator(
                    color: const Color(0xFF006733),
                    onRefresh: _notifier.refresh,
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: state.visibleItems.length,
                      itemBuilder: (context, index) {
                        return SuggestionListItem(
                          suggestion: state.visibleItems[index],
                        );
                      },
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _FilterTabs extends StatelessWidget {
  const _FilterTabs({required this.active, required this.onChanged});

  final SuggestionFilter active;
  final ValueChanged<SuggestionFilter> onChanged;

  static const _labels = {
    SuggestionFilter.all: 'Todas',
    SuggestionFilter.respondida: 'Respondidas',
    SuggestionFilter.lida: 'Lidas',
    SuggestionFilter.enviada: 'Enviadas',
  };

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: SuggestionFilter.values.map((filter) {
          final selected = filter == active;

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: ChoiceChip(
              label: Text(_labels[filter]!),
              selected: selected,
              showCheckmark: false,
              onSelected: (_) => onChanged(filter),
              selectedColor: const Color(0xFF006733),
              backgroundColor: Colors.white,
              labelStyle: TextStyle(
                color: selected ? Colors.white : const Color(0xFF424242),
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              shape: StadiumBorder(
                side: BorderSide(
                  color: selected
                      ? const Color(0xFF006733)
                      : const Color(0xFFE0E0E0),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
