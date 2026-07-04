import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';
import 'package:conectaparana/features/tickets/presentation/widgets/ticket_photo_carousel.dart';
import 'package:conectaparana/features/tickets/presentation/widgets/ticket_ui_mapper.dart';
import 'package:conectaparana/shared/widgets/feedback/app_toast.dart';
import 'package:conectaparana/shared/widgets/misc/badge.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';
import 'package:conectaparana/shared/widgets/misc/loading_spinner.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

const _pageBackground = Color(0xFFF5F7F8);
const _primaryGreen = Color(0xFF007A3D);
const _darkText = Color(0xFF101918);

enum _DetailState { loading, loaded, notFound, forbidden, error }

enum _TimelineEntryKind { created, comment, resolved }

class TicketDetailPage extends StatefulWidget {
  final String ticketId;
  final TicketRepository? repository;

  const TicketDetailPage({super.key, required this.ticketId, this.repository});

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage> {
  late final TicketRepository _repository;
  final TextEditingController _commentController = TextEditingController();

  _DetailState _state = _DetailState.loading;
  TicketDetail? _ticket;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RemoteTicketRepository();
    _loadTicket();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadTicket() async {
    setState(() => _state = _DetailState.loading);
    try {
      final ticket = await _repository.getTicketDetail(widget.ticketId);
      if (!mounted) return;
      setState(() {
        _ticket = ticket;
        _state = _DetailState.loaded;
      });
    } on TicketNotFoundException {
      if (!mounted) return;
      setState(() => _state = _DetailState.notFound);
    } on TicketForbiddenException {
      if (!mounted) return;
      setState(() => _state = _DetailState.forbidden);
    } catch (_) {
      if (!mounted) return;
      setState(() => _state = _DetailState.error);
    }
  }

  Future<void> _sendComment() async {
    final ticket = _ticket;
    final message = _commentController.text.trim();
    if (ticket == null || message.isEmpty || ticket.isClosed || _isSending) {
      return;
    }

    final optimistic = ticket.optimisticComment(message);
    setState(() {
      _isSending = true;
      _ticket = ticket.copyWith(comments: [...ticket.comments, optimistic]);
      _commentController.clear();
    });

    try {
      final saved = await _repository.addComment(
        ticketId: ticket.id,
        message: message,
      );
      if (!mounted || _ticket == null) return;
      setState(() {
        _ticket = _ticket!.copyWith(
          comments: _ticket!.comments
              .map((comment) => comment.id == optimistic.id ? saved : comment)
              .toList(),
        );
      });
    } catch (_) {
      if (!mounted || _ticket == null) return;
      setState(() {
        _ticket = _ticket!.copyWith(
          comments: _ticket!.comments
              .where((comment) => comment.id != optimistic.id)
              .toList(),
        );
        if (_commentController.text.isEmpty) {
          _commentController.text = message;
        }
      });
      AppToast.show(
        context,
        message: 'Não foi possível enviar. Tente novamente.',
        variant: AppToastVariant.error,
      );
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _openMaps(TicketDetail _) {
    AppToast.show(
      context,
      message: 'A função de mapa estará disponível em breve!',
      variant: AppToastVariant.info,
    );
  }

  @override
  Widget build(BuildContext context) {
    final ticket = _ticket;

    return Scaffold(
      key: const Key('ticket-detail-page'),
      backgroundColor: _pageBackground,
      body: SafeArea(child: _buildBody()),
      bottomNavigationBar: ticket != null && _state == _DetailState.loaded
          ? _CommentInput(
              controller: _commentController,
              isClosed: ticket.isClosed,
              isSending: _isSending,
              onSend: _sendComment,
            )
          : null,
    );
  }

  Widget _buildBody() {
    switch (_state) {
      case _DetailState.loading:
        return const Center(child: LoadingSpinner());
      case _DetailState.notFound:
        return EmptyState(
          icon: Icons.search_off_outlined,
          title: 'Ticket não encontrado',
          buttonLabel: 'Voltar',
          onButtonTap: () => context.pop(),
        );
      case _DetailState.forbidden:
        return EmptyState(
          icon: Icons.lock_outline,
          title: 'Você não tem acesso a este ticket',
          buttonLabel: 'Voltar',
          onButtonTap: () => context.pop(),
        );
      case _DetailState.error:
        return EmptyState(
          icon: Icons.wifi_off_outlined,
          title: 'Não foi possível carregar',
          subtitle: 'Verifique sua conexão e tente novamente.',
          buttonLabel: 'Tentar novamente',
          onButtonTap: _loadTicket,
        );
      case _DetailState.loaded:
        return _buildLoaded(_ticket!);
    }
  }

  Widget _buildLoaded(TicketDetail ticket) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _TopBar(ticket: ticket)),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          sliver: SliverList.list(
            children: [
              _TicketHeaderCard(ticket: ticket, onOpenMaps: _openMaps),
              const SizedBox(height: 24),
              _Timeline(ticket: ticket),
              if (ticket.status == 'resolvido' || ticket.status == 'fechado')
                Padding(
                  padding: const EdgeInsets.only(top: 24),
                  child: _ResolvedBanner(ticket: ticket),
                ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ],
    );
  }
}

class _TopBar extends StatelessWidget {
  final TicketDetail ticket;

  const _TopBar({required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 18),
      child: Row(
        children: [
          _CircleIconButton(
            icon: Icons.chevron_left,
            onTap: () => context.pop(),
          ),
          const SizedBox(width: 14),
          Text(
            ticket.displayNumber,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: Colors.grey.shade600,
              fontSize: 16,
            ),
          ),
          const SizedBox(width: 10),
          AppBadge(
            label: TicketUiMapper.statusExactLabel(ticket.status),
            variant: TicketUiMapper.statusExactVariant(ticket.status),
          ),
          const Spacer(),
          _CircleIconButton(
            icon: Icons.share_outlined,
            onTap: () => AppToast.show(
              context,
              message: 'Compartilhamento em breve.',
              variant: AppToastVariant.info,
            ),
          ),
        ],
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFEFF2F3),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(width: 48, height: 48, child: Icon(icon, size: 26)),
      ),
    );
  }
}

class _TicketHeaderCard extends StatelessWidget {
  final TicketDetail ticket;
  final ValueChanged<TicketDetail> onOpenMaps;

  const _TicketHeaderCard({required this.ticket, required this.onOpenMaps});

  @override
  Widget build(BuildContext context) {
    final typeColor = TicketUiMapper.typeColor(ticket.type);
    final hasLocation =
        ticket.address != null && ticket.address!.trim().isNotEmpty;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 5,
            decoration: BoxDecoration(
              color: typeColor,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        // ignore: deprecated_member_use
                        color: typeColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        TicketUiMapper.typeIcon(ticket.type),
                        color: typeColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            TicketUiMapper.typeLabel(ticket.type).toUpperCase(),
                            style: TextStyle(
                              color: typeColor,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.3,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Enviado em ${TicketUiMapper.formatDateTime(ticket.createdAt)}',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  ticket.title,
                  style: const TextStyle(
                    fontSize: 23,
                    height: 1.15,
                    fontWeight: FontWeight.w900,
                    color: _darkText,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  ticket.description,
                  style: TextStyle(
                    fontSize: 17,
                    height: 1.35,
                    color: Colors.grey.shade700,
                  ),
                ),
                if (ticket.photos.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  TicketPhotoCarousel(photos: ticket.photos),
                ],
                if (hasLocation) ...[
                  const SizedBox(height: 14),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        color: _primaryGreen,
                        size: 21,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          ticket.address!,
                          style: TextStyle(
                            fontSize: 16,
                            height: 1.25,
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    key: const Key('open-maps-button'),
                    onPressed: () => onOpenMaps(ticket),
                    icon: const Icon(Icons.map_outlined, size: 18),
                    label: const Text('Abrir no app de mapas'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _primaryGreen,
                      side: const BorderSide(color: _primaryGreen),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  final TicketDetail ticket;

  const _Timeline({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final entries = _TimelineEntry.fromTicket(ticket);

    return Column(
      key: const Key('timeline-list'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'HISTÓRICO DE ATUALIZAÇÕES',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: Color(0xFF53615D),
            letterSpacing: 1.8,
          ),
        ),
        const SizedBox(height: 16),
        ...List.generate(entries.length, (index) {
          return _TimelineTile(
            entry: entries[index],
            isLast: index == entries.length - 1,
          );
        }),
      ],
    );
  }
}

class _TimelineEntry {
  final _TimelineEntryKind kind;
  final DateTime createdAt;
  final String title;
  final String? author;
  final String? message;
  final String id;
  final TicketCommentAuthor? commentAuthor;
  final bool isOptimistic;
  final List<TicketPhoto> photos;

  const _TimelineEntry({
    required this.kind,
    required this.createdAt,
    required this.title,
    required this.id,
    this.author,
    this.message,
    this.commentAuthor,
    this.isOptimistic = false,
    this.photos = const [],
  });

  static List<_TimelineEntry> fromTicket(TicketDetail ticket) {
    final entries = <_TimelineEntry>[
      _TimelineEntry(
        kind: _TimelineEntryKind.created,
        id: 'created',
        createdAt: ticket.createdAt,
        title: 'Ticket criado',
        photos: ticket.photos.where((photo) => photo.hasImage).toList(),
        author: 'Você',
      ),
      ...ticket.comments.map(
        (comment) => _TimelineEntry(
          kind: _TimelineEntryKind.comment,
          id: comment.id,
          createdAt: comment.createdAt,
          title: comment.author == TicketCommentAuthor.admin
              ? 'Atualização do atendimento'
              : 'Comentário enviado',
          author:
              comment.authorName ??
              (comment.author == TicketCommentAuthor.admin
                  ? 'Equipe responsável'
                  : 'Você'),
          message: comment.message,
          commentAuthor: comment.author,
          isOptimistic: comment.isOptimistic,
          photos: comment.photos,
        ),
      ),
      if (ticket.resolvedAt != null)
        _TimelineEntry(
          kind: _TimelineEntryKind.resolved,
          id: 'resolved',
          createdAt: ticket.resolvedAt!,
          title: ticket.status == 'fechado'
              ? 'Ticket fechado'
              : 'Ticket resolvido',
          author: ticket.assignedToName ?? 'Equipe responsável',
          message:
              'O chamado foi marcado como ${TicketUiMapper.statusExactLabel(ticket.status).toLowerCase()}.',
        ),
    ]..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return entries;
  }
}

class _TimelineTile extends StatelessWidget {
  final _TimelineEntry entry;
  final bool isLast;

  const _TimelineTile({required this.entry, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final color = _entryColor(entry);
    final isAdmin = entry.commentAuthor == TicketCommentAuthor.admin;

    return IntrinsicHeight(
      key: Key('timeline-entry-${entry.id}'),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 52,
            child: Column(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(_entryIcon(entry), color: Colors.white, size: 22),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(width: 2, color: const Color(0xFFE2E7E5)),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          entry.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: _darkText,
                            height: 1.15,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        TicketUiMapper.formatDateTime(entry.createdAt),
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                  if (entry.author != null) ...[
                    const SizedBox(height: 3),
                    Text(
                      entry.author!,
                      style: TextStyle(
                        color: isAdmin ? _primaryGreen : Colors.grey.shade700,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                  if (entry.message != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isAdmin
                            ? const Color(0xFFEFF5F1)
                            : const Color(0xFFF0F3F4),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFDCE3E1)),
                      ),
                      child: Text(
                        entry.isOptimistic
                            ? '${entry.message!} (enviando...)'
                            : entry.message!,
                        style: TextStyle(
                          fontSize: 16,
                          height: 1.35,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],
                  if (entry.photos.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    TicketPhotoCarousel(photos: entry.photos),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _entryColor(_TimelineEntry entry) {
    if (entry.kind == _TimelineEntryKind.created) {
      return const Color(0xFF0EA5D7);
    }
    if (entry.kind == _TimelineEntryKind.resolved) return _primaryGreen;
    if (entry.commentAuthor == TicketCommentAuthor.admin) return _primaryGreen;
    return const Color(0xFFD98B00);
  }

  IconData _entryIcon(_TimelineEntry entry) {
    if (entry.kind == _TimelineEntryKind.resolved) return Icons.arrow_forward;
    if (entry.kind == _TimelineEntryKind.created) return Icons.check;
    if (entry.commentAuthor == TicketCommentAuthor.admin) return Icons.business;
    return Icons.person_outline;
  }
}

class _ResolvedBanner extends StatelessWidget {
  final TicketDetail ticket;

  const _ResolvedBanner({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final label = ticket.status == 'fechado'
        ? 'Ticket fechado'
        : 'Ticket concluído';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFDDF8E6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFA6E5BA)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              color: _primaryGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: _primaryGreen,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (ticket.resolvedAt != null)
                  Text(
                    'Encerrado em ${TicketUiMapper.formatDateTime(ticket.resolvedAt!)}',
                    style: TextStyle(fontSize: 15, color: Colors.grey.shade700),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CommentInput extends StatefulWidget {
  final TextEditingController controller;
  final bool isClosed;
  final bool isSending;
  final VoidCallback onSend;

  const _CommentInput({
    required this.controller,
    required this.isClosed,
    required this.isSending,
    required this.onSend,
  });

  @override
  State<_CommentInput> createState() => _CommentInputState();
}

class _CommentInputState extends State<_CommentInput> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_syncTextState);
    _hasText = widget.controller.text.trim().isNotEmpty;
  }

  @override
  void didUpdateWidget(covariant _CommentInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_syncTextState);
      widget.controller.addListener(_syncTextState);
      _syncTextState();
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_syncTextState);
    super.dispose();
  }

  void _syncTextState() {
    final next = widget.controller.text.trim().isNotEmpty;
    if (next != _hasText) setState(() => _hasText = next);
  }

  @override
  Widget build(BuildContext context) {
    final disabled = widget.isClosed;
    final canSend = _hasText && !disabled && !widget.isSending;

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                key: const Key('ticket-comment-input'),
                controller: widget.controller,
                enabled: !disabled,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText: disabled
                      ? 'Este ticket está fechado.'
                      : 'Adicionar comentário',
                  filled: true,
                  fillColor: const Color(0xFFF5F7F8),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _primaryGreen),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                key: const Key('send-comment-button'),
                onPressed: canSend ? widget.onSend : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryGreen,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  disabledForegroundColor: Colors.grey.shade600,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: widget.isSending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Enviar',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
