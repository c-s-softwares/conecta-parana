import 'package:flutter/foundation.dart';

import '../../domain/entities/feed_item.dart';
import '../../domain/repositories/feed_repository.dart';

enum FeedStatus {
  initial,
  loading,
  refreshing,
  success,
  empty,
  errorFirst,
  loadingMore,
  errorMore,
}

class FeedState {
  final FeedStatus status;
  final List<FeedItem> items;
  final String? cursor;
  final bool hasMore;
  final bool redirectToOnboarding;

  const FeedState({
    this.status = FeedStatus.initial,
    this.items = const [],
    this.cursor,
    this.hasMore = false,
    this.redirectToOnboarding = false,
  });

  FeedState copyWith({
    FeedStatus? status,
    List<FeedItem>? items,
    String? cursor,
    bool? hasMore,
    bool? redirectToOnboarding,
    bool clearCursor = false,
  }) {
    return FeedState(
      status: status ?? this.status,
      items: items ?? this.items,
      cursor: clearCursor ? null : (cursor ?? this.cursor),
      hasMore: hasMore ?? this.hasMore,
      redirectToOnboarding: redirectToOnboarding ?? this.redirectToOnboarding,
    );
  }
}

class FeedNotifier extends ValueNotifier<FeedState> {
  final FeedRepository _repository;
  final String cityId;
  final double? lat;
  final double? lng;

  FeedNotifier({
    required FeedRepository repository,
    required this.cityId,
    this.lat,
    this.lng,
  }) : _repository = repository,
       super(const FeedState());

  Future<void> load() async {
    value = value.copyWith(status: FeedStatus.loading, clearCursor: true);
    await _fetchPage(isRefresh: false);
  }

  Future<void> refresh() async {
    if (value.status == FeedStatus.refreshing ||
        value.status == FeedStatus.loading) {
      return;
    }

    value = value.copyWith(status: FeedStatus.refreshing, clearCursor: true);
    await _fetchPage(isRefresh: true);
  }

  Future<void> loadMore() async {
    if (!value.hasMore) return;
    if (value.status == FeedStatus.loadingMore) return;
    if (value.status == FeedStatus.loading ||
        value.status == FeedStatus.refreshing) {
      return;
    }

    value = value.copyWith(status: FeedStatus.loadingMore);
    await _fetchPage(isRefresh: false, cursor: value.cursor);
  }

  Future<void> _fetchPage({required bool isRefresh, String? cursor}) async {
    try {
      final page = await _repository.getFeed(
        cityId: cityId,
        lat: lat,
        lng: lng,
        cursor: cursor,
      );

      final merged = isRefresh || cursor == null
          ? page.items
          : [...value.items, ...page.items];

      value = value.copyWith(
        status: merged.isEmpty ? FeedStatus.empty : FeedStatus.success,
        items: merged,
        cursor: page.nextCursor,
        hasMore: page.hasMore,
      );
    } on FeedCityRequiredException {
      value = value.copyWith(
        status: FeedStatus.errorFirst,
        redirectToOnboarding: true,
      );
    } on FeedInvalidCursorException {
      value = value.copyWith(status: FeedStatus.loading, clearCursor: true);
      await _fetchPage(isRefresh: true);
    } on FeedNetworkException {
      if (cursor != null) {
        value = value.copyWith(status: FeedStatus.errorMore);
      } else if (isRefresh && value.items.isNotEmpty) {
        value = value.copyWith(status: FeedStatus.success);
      } else {
        value = value.copyWith(status: FeedStatus.errorFirst);
      }
    }
  }
}
