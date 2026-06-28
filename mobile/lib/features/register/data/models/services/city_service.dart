import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';
import 'package:dio/dio.dart';

class CityService {
  CityService({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;
  static const _kCacheKey = 'cities_cache_v1';
  static const _kCacheTimestampKey = 'cities_cache_ts_v1';
  static const _ttl = Duration(hours: 1);

  static List<City>? _memCache;
  static DateTime? _memCacheTime;

  static bool _hasBackendIds(List<City> cities) {
    return cities.isNotEmpty && cities.every((city) => city.hasValidBackendId);
  }

  static List<City> _parseCitiesResponse(dynamic data) {
    final raw = switch (data) {
      final List<dynamic> list => list,
      final Map<String, dynamic> map =>
        map['items'] as List<dynamic>? ?? const [],
      _ => const <dynamic>[],
    };

    return raw.map((e) => City.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<City>> getCities() async {
    final now = DateTime.now();

    if (_memCache != null && _memCacheTime != null) {
      if (now.difference(_memCacheTime!) < _ttl && _hasBackendIds(_memCache!)) {
        return _memCache!;
      }
    }

    final prefs = await SharedPreferences.getInstance();
    final cachedJson = prefs.getString(_kCacheKey);
    final cachedTs = prefs.getInt(_kCacheTimestampKey);

    if (cachedJson != null && cachedTs != null) {
      final age = now.millisecondsSinceEpoch - cachedTs;

      if (age < _ttl.inMilliseconds) {
        try {
          final list = (jsonDecode(cachedJson) as List)
              .map((e) => City.fromJson(e as Map<String, dynamic>))
              .toList();

          if (_hasBackendIds(list)) {
            _memCache = list;
            _memCacheTime = DateTime.fromMillisecondsSinceEpoch(cachedTs);
            return list;
          }

          await prefs.remove(_kCacheKey);
          await prefs.remove(_kCacheTimestampKey);
        } catch (_) {
          await prefs.remove(_kCacheKey);
          await prefs.remove(_kCacheTimestampKey);
        }
      }
    }

    final response = await _dio.get('/cities');

    final cities = _parseCitiesResponse(response.data);

    if (!_hasBackendIds(cities)) {
      await prefs.remove(_kCacheKey);
      await prefs.remove(_kCacheTimestampKey);
      throw const InvalidCitiesResponseException();
    }

    _memCache = cities;
    _memCacheTime = now;

    await prefs.setString(
      _kCacheKey,
      jsonEncode(cities.map((c) => c.toJson()).toList()),
    );

    await prefs.setInt(_kCacheTimestampKey, now.millisecondsSinceEpoch);

    return cities;
  }

  static Future<void> clearCache() async {
    _memCache = null;
    _memCacheTime = null;

    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(_kCacheKey);
    await prefs.remove(_kCacheTimestampKey);
  }
}

class InvalidCitiesResponseException implements Exception {
  const InvalidCitiesResponseException();
}
