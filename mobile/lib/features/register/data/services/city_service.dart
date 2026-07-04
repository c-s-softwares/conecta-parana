import 'dart:convert';

import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CityService {
  CityService({Dio? dio}) : _dio = dio ?? ApiClient.instance.dio;

  final Dio _dio;

  static const _cacheKey = 'cities_cache_v1';
  static const _cacheTimestampKey = 'cities_cache_ts_v1';
  static const _ttl = Duration(hours: 1);
  static const _pageSize = 100;

  static List<City>? _memoryCache;
  static DateTime? _memoryCacheTime;

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

    return raw
        .whereType<Map<String, dynamic>>()
        .map(City.fromJson)
        .toList(growable: false);
  }

  Future<List<City>> getCities() async {
    final now = DateTime.now();
    final memoryCache = _memoryCache;
    final memoryCacheTime = _memoryCacheTime;
    if (memoryCache != null &&
        memoryCacheTime != null &&
        now.difference(memoryCacheTime) < _ttl &&
        _hasBackendIds(memoryCache)) {
      return memoryCache;
    }

    final preferences = await SharedPreferences.getInstance();
    final cachedJson = preferences.getString(_cacheKey);
    final cachedTimestamp = preferences.getInt(_cacheTimestampKey);
    if (cachedJson != null && cachedTimestamp != null) {
      final cacheTime = DateTime.fromMillisecondsSinceEpoch(cachedTimestamp);
      if (now.difference(cacheTime) < _ttl) {
        try {
          final cachedCities = (jsonDecode(cachedJson) as List<dynamic>)
              .whereType<Map<String, dynamic>>()
              .map(City.fromJson)
              .toList(growable: false);
          if (_hasBackendIds(cachedCities)) {
            _memoryCache = cachedCities;
            _memoryCacheTime = cacheTime;
            return cachedCities;
          }
        } catch (_) {
          // Invalid cache is removed before fetching fresh data.
        }
        await _clearDiskCache(preferences);
      }
    }

    final response = await _dio.get(
      '/cities',
      queryParameters: {'page': 1, 'pageSize': _pageSize},
    );
    final cities = _parseCitiesResponse(response.data);
    if (!_hasBackendIds(cities)) {
      await _clearDiskCache(preferences);
      throw const InvalidCitiesResponseException();
    }

    _memoryCache = cities;
    _memoryCacheTime = now;
    await preferences.setString(
      _cacheKey,
      jsonEncode(cities.map((city) => city.toJson()).toList()),
    );
    await preferences.setInt(_cacheTimestampKey, now.millisecondsSinceEpoch);
    return cities;
  }

  static Future<void> clearCache() async {
    _memoryCache = null;
    _memoryCacheTime = null;
    await _clearDiskCache(await SharedPreferences.getInstance());
  }

  static Future<void> _clearDiskCache(SharedPreferences preferences) async {
    await preferences.remove(_cacheKey);
    await preferences.remove(_cacheTimestampKey);
  }
}

class InvalidCitiesResponseException implements Exception {
  const InvalidCitiesResponseException();
}
