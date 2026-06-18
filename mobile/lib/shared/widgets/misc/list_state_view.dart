import 'dart:async';
import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/misc/empty_state.dart';

class ListStateView extends StatelessWidget {
  const ListStateView({
    super.key,
    required this.isLoading,
    required this.hasError,
    required this.isEmpty,
    required this.loadingSkeleton,
    required this.builder,
    this.hasActiveFilters = false,
    this.onRetry,
    this.onClearFilters,

    this.emptyIcon = Icons.inbox_outlined,
    this.emptyTitle = 'Nada por aqui ainda.',
    this.emptySubtitle,
    this.emptyActionLabel,
    this.onEmptyAction,

    this.errorTitle = 'Algo deu errado.',
    this.errorSubtitle = 'Não foi possível carregar, tente novamente.',
  });

  final bool isLoading;
  final bool hasError;
  final bool isEmpty;
  final bool hasActiveFilters;

  final Widget loadingSkeleton;   
  final WidgetBuilder builder;    

  final VoidCallback? onRetry;
  final VoidCallback? onClearFilters;

  final IconData emptyIcon;
  final String emptyTitle;
  final String? emptySubtitle;
  final String? emptyActionLabel;
  final VoidCallback? onEmptyAction;

  final String errorTitle;
  final String errorSubtitle;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return _DelayedDisplay(child: loadingSkeleton);
    }

    if (hasError) {
      return EmptyState(
        icon: Icons.cloud_off_outlined,
        title: errorTitle,
        subtitle: errorSubtitle,
        buttonLabel: onRetry != null ? 'Tentar novamente' : null,
        onButtonTap: onRetry,
      );
    }

    if (isEmpty) {
      if (hasActiveFilters) {
        return EmptyState(
          icon: Icons.search_off_outlined,
          title: 'Nenhum resultado pelos filtros.',
          subtitle: 'Tente ajustar ou limpar os filtros.',
          buttonLabel: onClearFilters != null ? 'Limpar filtros' : null,
          onButtonTap: onClearFilters,
        );
      }

      return EmptyState(
        icon: emptyIcon,
        title: emptyTitle,
        subtitle: emptySubtitle,
        buttonLabel: emptyActionLabel,
        onButtonTap: onEmptyAction,
      );
    }

    return builder(context);
  }
}

class _DelayedDisplay extends StatefulWidget {
  const _DelayedDisplay({
    required this.child,
    this.delay = const Duration(milliseconds: 200),
  });

  final Widget child;
  final Duration delay;

  @override
  State<_DelayedDisplay> createState() => _DelayedDisplayState();
}

class _DelayedDisplayState extends State<_DelayedDisplay> {
  bool _visible = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(widget.delay, () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      _visible ? widget.child : const SizedBox.shrink();
}