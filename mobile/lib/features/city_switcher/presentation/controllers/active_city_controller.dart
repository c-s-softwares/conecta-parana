import 'dart:async';

import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ActiveCityController extends ValueNotifier<City?> {
  ActiveCityController({
    FlutterSecureStorage? storage,
    Dio? dio,
    Duration debounceDuration = const Duration(minutes: 5),
    Duration retryDuration = const Duration(seconds: 60),
  }) : _storage = storage ?? const FlutterSecureStorage(),
       _dio = dio ?? ApiClient.instance.dio,
       _debounceDuration = debounceDuration,
       _retryDuration = retryDuration,
       super(null);

  static const _cityIdKey = 'active_city_id';
  static const _cityNameKey = 'active_city_name';

  final FlutterSecureStorage _storage;
  final Dio _dio;
  final Duration _debounceDuration;
  final Duration _retryDuration;

  Timer? _debounceTimer;
  Timer? _retryTimer;

  Future<void> loadFromStorage() async {
    final id = await _storage.read(key: _cityIdKey);
    final name = await _storage.read(key: _cityNameKey);

    if (id == null || id.isEmpty || name == null || name.isEmpty) {
      return;
    }

    value = City(id: id, name: name);
  }

  Future<void> setActiveCity(City city) async {
    value = city;

    await _storage.write(key: _cityIdKey, value: city.id);
    await _storage.write(key: _cityNameKey, value: city.name);

    _scheduleDebounce(city);
  }

  Future<void> syncFromProfileIfEmpty({
    required String? cityId,
    required String? cityName,
  }) async {
    if (value != null) return;

    final hasCity =
        cityId != null &&
        cityId.isNotEmpty &&
        cityName != null &&
        cityName.isNotEmpty;

    if (!hasCity) return;

    final city = City(id: cityId, name: cityName);
    value = city;

    await _storage.write(key: _cityIdKey, value: city.id);
    await _storage.write(key: _cityNameKey, value: city.name);
  }

  void _scheduleDebounce(City city) {
    _debounceTimer?.cancel();
    _retryTimer?.cancel();

    _debounceTimer = Timer(_debounceDuration, () {
      _persistCity(city);
    });
  }

  void _scheduleRetry(City city, Duration duration) {
    _retryTimer?.cancel();

    _retryTimer = Timer(duration, () {
      if (value?.id != city.id) return;
      _persistCity(city);
    });
  }

  Future<void> _persistCity(City city) async {
    if (value?.id != city.id) return;

    try {
      await _dio.put(
        '/users/me/city',
        data: {'cityId': city.id},
        options: Options(extra: {'auth': true}),
      );
      debugPrint('[ActiveCityController] cidade persistida: ${city.id}');
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;
      final errorCode = error.response?.data?['code'];

      if (statusCode == 429 && errorCode == 'update_too_frequent') {
        debugPrint(
          '[ActiveCityController] PUT /users/me/city retornou 429. Retry em 60s.',
        );
        _scheduleRetry(city, _retryDuration);
        return;
      }

      debugPrint(
        '[ActiveCityController] Falha ao persistir: status=$statusCode body=${error.response?.data}', // TEMP
      );

      _scheduleRetry(city, _debounceDuration);
    } catch (_) {
      debugPrint(
        '[ActiveCityController] Erro inesperado ao persistir cidade ativa. Novo ciclo será agendado.',
      );

      _scheduleRetry(city, _debounceDuration);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _retryTimer?.cancel();
    super.dispose();
  }
}
