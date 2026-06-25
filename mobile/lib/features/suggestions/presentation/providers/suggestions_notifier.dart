import 'package:flutter/foundation.dart';

import '../../domain/entities/suggestion.dart';
import '../../domain/repositories/suggestion_repository.dart';

enum SuggestionsStatus { initial, loading, refreshing, success, error }

enum SuggestionFilter { all, respondida, lida, enviada }

class SuggestionsState {
  final SuggestionsStatus status;
  final List<Suggestion> items; 
  final SuggestionFilter filter;

  const SuggestionsState({
    this.status = SuggestionsStatus.initial,
    this.items = const [],
    this.filter = SuggestionFilter.all,
  });

  List<Suggestion> get visibleItems {
    final target = _statusFor(filter);
    if (target == null) return items; 
    return items.where((s) => s.status == target).toList();
  }

  bool get hasActiveFilter => filter != SuggestionFilter.all;

  static SuggestionStatus? _statusFor(SuggestionFilter f) {
    switch (f) {
      case SuggestionFilter.all:
        return null;
      case SuggestionFilter.respondida:
        return SuggestionStatus.respondida;
      case SuggestionFilter.lida:
        return SuggestionStatus.lida;
      case SuggestionFilter.enviada:
        return SuggestionStatus.enviada;
    }
  }

  SuggestionsState copyWith({
    SuggestionsStatus? status,
    List<Suggestion>? items,
    SuggestionFilter? filter,
  }) {
    return SuggestionsState(
      status: status ?? this.status,
      items: items ?? this.items,
      filter: filter ?? this.filter,
    );
  }
}

class SuggestionsNotifier extends ValueNotifier<SuggestionsState> {
  final SuggestionRepository _repository;

  SuggestionsNotifier({required SuggestionRepository repository})
      : _repository = repository,
        super(const SuggestionsState());

  Future<void> load() async {
    value = value.copyWith(status: SuggestionsStatus.loading);
    await _fetch();
  }

  Future<void> refresh() async {
    if (value.status == SuggestionsStatus.loading ||
        value.status == SuggestionsStatus.refreshing) {
      return;
    }
    value = value.copyWith(status: SuggestionsStatus.refreshing);
    await _fetch();
  }

  void setFilter(SuggestionFilter filter) {
    if (filter == value.filter) return;
    value = value.copyWith(filter: filter);
  }

  Future<void> _fetch() async {
    try {
      final items = await _repository.getMySuggestions();
      value = value.copyWith(
        status: SuggestionsStatus.success,
        items: items,
      );
    } on SuggestionNetworkException {
      if (value.items.isNotEmpty) {
        value = value.copyWith(status: SuggestionsStatus.success);
      } else {
        value = value.copyWith(status: SuggestionsStatus.error);
      }
    }
  }
}