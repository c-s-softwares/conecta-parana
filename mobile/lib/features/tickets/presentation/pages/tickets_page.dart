import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';
import 'package:conectaparana/features/tickets/presentation/widgets/ticket_list_item.dart';
import 'package:conectaparana/features/tickets/presentation/widgets/ticket_summary_card.dart';
import 'package:conectaparana/features/tickets/presentation/widgets/ticket_ui_mapper.dart';
import 'package:conectaparana/core/router/app_router.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/misc/app_chip.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';

enum _PageState { loading, loaded, error }

enum _TicketFilter { todos, abertos, emAnalise, respondidos, concluidos }

extension on _TicketFilter {
  String get label {
    switch (this) {
      case _TicketFilter.todos:
        return 'Todos';
      case _TicketFilter.abertos:
        return 'Abertos';
      case _TicketFilter.emAnalise:
        return 'Em análise';
      case _TicketFilter.respondidos:
        return 'Respondido';
      case _TicketFilter.concluidos:
        return 'Concluído';
    }
  }

  bool matches(Ticket ticket) {
    if (this == _TicketFilter.todos) return true;

    final group = TicketUiMapper.statusGroup(ticket.status);
    switch (this) {
      case _TicketFilter.abertos:
        return group == TicketStatusGroup.aberto;
      case _TicketFilter.emAnalise:
        return group == TicketStatusGroup.emAnalise;
      case _TicketFilter.respondidos:
        return group == TicketStatusGroup.respondido;
      case _TicketFilter.concluidos:
        return group == TicketStatusGroup.concluido;
      case _TicketFilter.todos:
        return true;
    }
  }
}

class TicketsPage extends StatefulWidget {
  final TicketRepository? repository;

  const TicketsPage({super.key, this.repository});

  @override
  State<TicketsPage> createState() => _TicketsPageState();
}

class _TicketsPageState extends State<TicketsPage> {
  late final TicketRepository _repository;

  _PageState _state = _PageState.loading;
  List<Ticket> _tickets = const [];
  bool _isRefreshing = false;
  _TicketFilter _filter = _TicketFilter.todos;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RemoteTicketRepository();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() => _state = _PageState.loading);
    try {
      final tickets = await _repository.getMyTickets();
      if (!mounted) return;
      setState(() {
        _tickets = tickets;
        _state = _PageState.loaded;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _state = _PageState.error);
    }
  }

  Future<void> _handleRefresh() async {
    if (_isRefreshing) return;
    _isRefreshing = true;
    try {
      final tickets = await _repository.getMyTickets();
      if (!mounted) return;
      setState(() {
        _tickets = tickets;
        _state = _PageState.loaded;
      });
    } on DioException {
      _showRefreshError();
    } catch (_) {
      _showRefreshError();
    } finally {
      _isRefreshing = false;
    }
  }

  void _showRefreshError() {
    if (!mounted) return;
    AppToast.show(
      context,
      message: 'Não foi possível atualizar a lista.',
      variant: AppToastVariant.error,
    );
  }

  void _handleNewTicket() {
    context.push(AppRoutes.newTicket);
  }

  void _handleTicketTap(Ticket ticket) {
    context.push('/tickets/${ticket.id}');
  }

  int _countByGroup(TicketStatusGroup group) {
    return _tickets
        .where((t) => TicketUiMapper.statusGroup(t.status) == group)
        .length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F8),
      body: SafeArea(child: _buildBody()),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _handleNewTicket,
              icon: const Icon(Icons.add),
              label: const Text(
                'Abrir novo ticket',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF006733),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_state) {
      case _PageState.loading:
        return const Center(child: LoadingSpinner());
      case _PageState.error:
        return EmptyState(
          icon: Icons.wifi_off_outlined,
          title: 'Não foi possível carregar',
          subtitle: 'Verifique sua conexão e tente novamente.',
          buttonLabel: 'Tentar novamente',
          onButtonTap: _loadTickets,
        );
      case _PageState.loaded:
        return _buildLoaded();
    }
  }

  Widget _buildLoaded() {
    final filtered = _tickets.where(_filter.matches).toList();

    return RefreshIndicator(
      onRefresh: _handleRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _buildHeader()),
          if (_tickets.isNotEmpty) SliverToBoxAdapter(child: _buildSummary()),
          SliverToBoxAdapter(child: _buildFilters()),
          if (filtered.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(
                icon: Icons.confirmation_number_outlined,
                title: _tickets.isEmpty
                    ? 'Você ainda não abriu tickets.'
                    : 'Nenhum ticket nesta categoria.',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              sliver: SliverList.separated(
                itemCount: filtered.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final ticket = filtered[index];
                  return TicketListItem(
                    ticket: ticket,
                    onTap: () => _handleTicketTap(ticket),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
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
                  'CIDADÃO',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                    color: Color(0xFF006733),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Meus Tickets',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Icon(Icons.tune, color: Colors.black54, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildSummary() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: TicketSummaryCard(
              count: '${_countByGroup(TicketStatusGroup.aberto)}',
              label: 'Abertos',
              color: const Color(0xFF1565C0),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TicketSummaryCard(
              count: '${_countByGroup(TicketStatusGroup.emAnalise)}',
              label: 'Em análise',
              color: const Color(0xFFD4820A),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TicketSummaryCard(
              count: '${_countByGroup(TicketStatusGroup.concluido)}',
              label: 'Concluídos',
              color: const Color(0xFF006733),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: SizedBox(
        height: 36,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: _TicketFilter.values.length,
          separatorBuilder: (context, index) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final filter = _TicketFilter.values[index];
            return AppChip(
              label: filter.label,
              isSelected: _filter == filter,
              onTap: () => setState(() => _filter = filter),
            );
          },
        ),
      ),
    );
  }
}
