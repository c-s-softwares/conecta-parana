import 'dart:convert';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CityService {
  static const _kCacheKey = 'cities_cache_v1';
  static const _kCacheTimestampKey = 'cities_cache_ts_v1';
  static const _ttl = Duration(hours: 1);

  static const _kPageSize = 100;

  static List<City>? _memCache;
  static DateTime? _memCacheTime;

  static const List<City> _demoCities = [
    City(id: 'maringa', name: 'Maringá', state: 'PR'),
    City(id: 'sarandi', name: 'Sarandi', state: 'PR'),
    City(id: 'paicandu', name: 'Paiçandu', state: 'PR'),
    City(id: 'curitiba', name: 'Curitiba', state: 'PR'),
  ];

  Future<List<City>> getCities() async {
    final now = DateTime.now();

    if (_memCache != null && _memCacheTime != null) {
      if (now.difference(_memCacheTime!) < _ttl) {
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

          _memCache = list;
          _memCacheTime = DateTime.fromMillisecondsSinceEpoch(cachedTs);

          return list;
        } catch (_) {
          await prefs.remove(_kCacheKey);
          await prefs.remove(_kCacheTimestampKey);
        }
      }
    }

    try {
      final response = await ApiClient.instance.dio.get(
        '/cities',
        queryParameters: {'pageSize': _kPageSize},
      );

      final items = response.data['items'] as List;
      final cities = items
          .map((e) => City.fromJson(e as Map<String, dynamic>))
          .toList();

      _memCache = cities;
      _memCacheTime = now;

      await prefs.setString(
        _kCacheKey,
        jsonEncode(cities.map((c) => c.toJson()).toList()),
      );

      await prefs.setInt(_kCacheTimestampKey, now.millisecondsSinceEpoch);

      return cities;
    } catch (_) {
      return _demoCities;
    }
  }

  static Future<void> clearCache() async {
    _memCache = null;
    _memCacheTime = null;

    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(_kCacheKey);
    await prefs.remove(_kCacheTimestampKey);
  }
}
