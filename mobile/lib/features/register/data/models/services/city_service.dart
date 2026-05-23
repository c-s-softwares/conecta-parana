import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';

class CityService {
  static const _kCacheKey = 'cities_cache_v1';
  static const _kCacheTimestampKey = 'cities_cache_ts_v1';
  static const _ttl = Duration(hours: 1);

  static List<City>? _memCache;
  static DateTime? _memCacheTime;

  Future<List<City>> getCities() async {
    if (_memCache != null && _memCacheTime != null) {
      if (DateTime.now().difference(_memCacheTime!) < _ttl) {
        return _memCache!;
      }
    }

    final prefs = await SharedPreferences.getInstance();
    final cachedJson = prefs.getString(_kCacheKey);
    final cachedTs = prefs.getInt(_kCacheTimestampKey);

    if (cachedJson != null && cachedTs != null) {
      final age = DateTime.now().millisecondsSinceEpoch - cachedTs;
      if (age < _ttl.inMilliseconds) {
        final list = (jsonDecode(cachedJson) as List)
            .map((e) => City.fromJson(e as Map<String, dynamic>))
            .toList();
        _memCache = list;
        _memCacheTime = DateTime.fromMillisecondsSinceEpoch(cachedTs);
        return list;
      }
    }

    final response = await ApiClient.instance.dio.get('/cities');
    final cities = (response.data as List)
        .map((e) => City.fromJson(e as Map<String, dynamic>))
        .toList();

    _memCache = cities;
    _memCacheTime = DateTime.now();
    await prefs.setString(
      _kCacheKey,
      jsonEncode(cities.map((c) => c.toJson()).toList()),
    );
    await prefs.setInt(
      _kCacheTimestampKey,
      DateTime.now().millisecondsSinceEpoch,
    );

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