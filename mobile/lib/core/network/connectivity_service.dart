import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

enum ConnectivityStatus { online, offline }

class ConnectivityService {
  ConnectivityService._();
  static final ConnectivityService instance = ConnectivityService._();

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  final ValueNotifier<ConnectivityStatus> status =
      ValueNotifier(ConnectivityStatus.online);

  bool get isOffline => status.value == ConnectivityStatus.offline;

  Future<void> init() async {
    status.value = _fromResults(await _connectivity.checkConnectivity());
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      status.value = _fromResults(results);
    });
  }

  ConnectivityStatus _fromResults(List<ConnectivityResult> results) {
    final hasConnection = results.any((r) => r != ConnectivityResult.none);
    return hasConnection
        ? ConnectivityStatus.online
        : ConnectivityStatus.offline;
  }

  void dispose() => _subscription?.cancel();
}