import 'dart:async';

import 'package:conectaparana/core/auth/auth_event.dart';
import 'package:conectaparana/core/auth/auth_user.dart';
import 'package:conectaparana/core/auth/jwt_decoder.dart';
import 'package:conectaparana/core/auth/token_storage.dart';
import 'package:conectaparana/features/register/data/services/city_service.dart';
import 'package:flutter/material.dart';

class AuthService {
  AuthService._();

  static AuthService? _instance;

  static AuthService get instance {
    _instance ??= AuthService._();
    return _instance!;
  }

  @visibleForTesting
  static void overrideInstance(AuthService service) {
    _instance = service;
  }

  @visibleForTesting
  static void reset() {
    _instance = null;
  }

  final TokenStorage _storage = TokenStorage();

  final ValueNotifier<AuthUser?> currentUser = ValueNotifier(null);

  final _eventController = StreamController<AuthEvent>.broadcast();
  Stream<AuthEvent> get events => _eventController.stream;

  Future<void> init() async {
    try {
      final tokens = await _storage.getTokens();
      final accessToken = tokens.$1;

      if (accessToken == null) return;

      final payload = JwtDecoder.decode(accessToken);

      if (payload.role == 'ADMIN') {
        await logout();
        return;
      }

      final cityName = await _resolveCityName(payload.cityId);

      currentUser.value = AuthUser(
        id: payload.sub,
        role: payload.role,
        cityId: payload.cityId,
        cityName: cityName,
      );
    } catch (e) {
      await _storage.clear();
      currentUser.value = null;
    }
  }

  Future<void> login({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    await _storage.getTokens();

    try {
      final payload = JwtDecoder.decode(accessToken);

      if (payload.role == 'ADMIN') {
        await logout();
        _eventController.add(AuthEvent.adminNotAllowed);
        return;
      }

      currentUser.value = AuthUser(
        id: payload.sub,
        role: payload.role,
        cityId: payload.cityId,
        cityName: await _resolveCityName(payload.cityId),
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout({bool expired = false}) async {
    await _storage.clear();
    currentUser.value = null;
    if (expired) {
      _eventController.add(AuthEvent.sessionExpired);
    }
  }

  Future<void> refresh() async {}

  Future<void> register() async {}

  Future<void> logoutAll() async {
    await logout();
  }

  Future<String?> getAccessToken() async {
    final tokens = await _storage.getTokens();
    return tokens.$1;
  }

  Future<String?> getRefreshToken() async {
    final tokens = await _storage.getTokens();
    return tokens.$2;
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<String> _resolveCityName(String cityId) async {
    if (cityId.isEmpty) return '';
    try {
      final cities = await CityService().getCities();
      return cities
          .firstWhere(
            (c) => c.id == cityId,
            orElse: () => throw StateError('not found'),
          )
          .name;
    } catch (_) {
      return '';
    }
  }
}