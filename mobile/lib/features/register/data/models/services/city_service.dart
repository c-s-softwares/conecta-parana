import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';

class CityService {
  static List<City>? _cache;
  static DateTime? _cacheTime;
  static const _ttl = Duration(hours: 1); 

  Future<List<City>> getCities() async {
    if (_cache != null && _cacheTime != null) {
      final idade = DateTime.now().difference(_cacheTime!);
      if (idade < _ttl) return _cache!;
    }

    final response = await ApiClient.instance.dio.get('/cities');
    _cache = (response.data as List)
        .map((e) => City.fromJson(e as Map<String, dynamic>))
        .toList();
    _cacheTime = DateTime.now();
    return _cache!;
  }

  static void clearCache() {
    _cache = null;
    _cacheTime = null;
  }
}