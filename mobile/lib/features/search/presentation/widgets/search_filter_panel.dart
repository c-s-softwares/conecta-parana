import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:conectaparana/features/search/data/search_repository.dart';
import 'package:flutter/material.dart';

typedef SearchCityLoader = Future<List<City>> Function();

class SearchFilterValue {
  const SearchFilterValue({required this.city, required this.type});

  final City? city;
  final SearchResultType? type;
}

Future<List<City>> loadAllSearchCities() async {
  const pageSize = 100;
  var page = 1;
  var total = 0;
  final cities = <City>[];
  do {
    final response = await ApiClient.instance.dio.get<Map<String, dynamic>>(
      '/cities',
      queryParameters: {'page': page, 'pageSize': pageSize},
    );
    final data = response.data ?? const <String, dynamic>{};
    final items = data['items'] as List<dynamic>? ?? const <dynamic>[];
    total = data['total'] as int? ?? items.length;
    cities.addAll(
      items.whereType<Map<String, dynamic>>().map(
        (item) => City(id: item['id'] as String, name: item['name'] as String),
      ),
    );
    if (items.isEmpty) break;
    page++;
  } while (cities.length < total);
  return cities;
}

class SearchFilterPanel extends StatefulWidget {
  const SearchFilterPanel({
    super.key,
    required this.value,
    required this.onApply,
    required this.onCancel,
    this.cityLoader = loadAllSearchCities,
  });

  final SearchFilterValue value;
  final ValueChanged<SearchFilterValue> onApply;
  final VoidCallback onCancel;
  final SearchCityLoader cityLoader;

  @override
  State<SearchFilterPanel> createState() => _SearchFilterPanelState();
}

class _SearchFilterPanelState extends State<SearchFilterPanel> {
  late String? _cityId;
  late SearchResultType? _type;
  late Future<List<City>> _citiesFuture;

  @override
  void initState() {
    super.initState();
    _cityId = widget.value.city?.id;
    _type = widget.value.type;
    _citiesFuture = widget.cityLoader();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      key: const Key('search_filter_panel'),
      color: Colors.white,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 12, 4),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Filtros da busca',
                    style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                  ),
                ),
                IconButton(
                  onPressed: widget.onCancel,
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              children: [
                _sectionTitle('Cidades'),
                FutureBuilder<List<City>>(
                  future: _citiesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return TextButton.icon(
                        onPressed: () => setState(() {
                          _citiesFuture = widget.cityLoader();
                        }),
                        icon: const Icon(Icons.refresh),
                        label: const Text('Tentar carregar cidades novamente'),
                      );
                    }
                    final cities = snapshot.data ?? const <City>[];
                    return RadioGroup<String>(
                      groupValue: _cityId ?? '',
                      onChanged: (value) => setState(
                        () => _cityId = value?.isEmpty == true ? null : value,
                      ),
                      child: Column(
                        children: [
                          const RadioListTile<String>(
                            key: Key('search_all_cities_checkbox'),
                            value: '',
                            title: Text('Todas'),
                            contentPadding: EdgeInsets.zero,
                          ),
                          for (final city in cities)
                            RadioListTile<String>(
                              key: Key('search_city_checkbox_${city.id}'),
                              value: city.id,
                              title: Text(city.name),
                              contentPadding: EdgeInsets.zero,
                            ),
                        ],
                      ),
                    );
                  },
                ),
                _sectionTitle('Tipos'),
                RadioGroup<String>(
                  groupValue: _type?.name ?? '',
                  onChanged: (value) => setState(() {
                    _type = SearchResultType.values
                        .where((type) => type.name == value)
                        .firstOrNull;
                  }),
                  child: Column(
                    children: [
                      const RadioListTile<String>(
                        key: Key('search_all_types_checkbox'),
                        value: '',
                        title: Text('Todos'),
                        contentPadding: EdgeInsets.zero,
                      ),
                      for (final option in const [
                        (SearchResultType.locals, 'Serviços'),
                        (SearchResultType.news, 'Notícias'),
                        (SearchResultType.events, 'Eventos'),
                        (SearchResultType.communicates, 'Comunicados'),
                      ])
                        RadioListTile<String>(
                          key: Key('search_type_checkbox_${option.$1.name}'),
                          value: option.$1.name,
                          title: Text(option.$2),
                          contentPadding: EdgeInsets.zero,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                key: const Key('apply_search_filters_button'),
                onPressed: () async {
                  final allCities = await _citiesFuture;
                  if (!mounted) return;
                  widget.onApply(
                    SearchFilterValue(
                      city: allCities.cast<City?>().firstWhere(
                        (city) => city?.id == _cityId,
                        orElse: () => null,
                      ),
                      type: _type,
                    ),
                  );
                },
                child: const Text('Aplicar filtros'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String label) => Padding(
    padding: const EdgeInsets.only(top: 12, bottom: 4),
    child: Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
  );
}
