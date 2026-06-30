import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/register/data/models/city_model.dart';
import 'package:flutter/material.dart';

typedef CityLoader = Future<List<City>> Function();

Future<City?> showCitySelectorBottomSheet(
  BuildContext context, {
  String? selectedCityId,
  CityLoader? loadCities,
  String description =
      'A troca muda o feed agora e será salva no perfil após 5 minutos.',
}) {
  return showModalBottomSheet<City>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) {
      return CitySelectorBottomSheet(
        selectedCityId: selectedCityId,
        loadCities: loadCities ?? _loadCitiesFromApi,
        description: description,
      );
    },
  );
}

Future<List<City>> _loadCitiesFromApi() async {
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
        (item) => City(
          id: item['id'] as String,
          name: item['name'] as String,
          state: (item['estado'] ?? item['state'] ?? 'PR') as String,
        ),
      ),
    );
    if (items.isEmpty) break;
    page++;
  } while (cities.length < total);

  return cities;
}

class CitySelectorBottomSheet extends StatefulWidget {
  const CitySelectorBottomSheet({
    super.key,
    required this.loadCities,
    this.description =
        'A troca muda o feed agora e será salva no perfil após 5 minutos.',
    this.selectedCityId,
  });

  final CityLoader loadCities;
  final String? selectedCityId;
  final String description;

  @override
  State<CitySelectorBottomSheet> createState() =>
      _CitySelectorBottomSheetState();
}

class _CitySelectorBottomSheetState extends State<CitySelectorBottomSheet> {
  final _searchController = TextEditingController();

  bool _isLoading = true;
  bool _hasError = false;
  List<City> _cities = [];
  List<City> _filteredCities = [];

  @override
  void initState() {
    super.initState();
    _loadCities();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCities() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final cities = await widget.loadCities();

      if (!mounted) return;

      setState(() {
        _cities = cities;
        _filteredCities = cities;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('[CitySelector] /cities falhou: $e');
      if (!mounted) return;

      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  void _filterCities(String query) {
    final normalizedQuery = query.trim().toLowerCase();

    setState(() {
      _filteredCities = normalizedQuery.isEmpty
          ? _cities
          : _cities
                .where(
                  (city) => city.name.toLowerCase().contains(normalizedQuery),
                )
                .toList();
    });
  }

  void _selectCity(City city) {
    Navigator.of(context).pop(city);
  }

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.sizeOf(context).height * 0.85;

    return Container(
      constraints: BoxConstraints(maxHeight: maxHeight),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAF9),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFD0D7D3),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Escolha sua cidade',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF102018),
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Fechar',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  widget.description,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF607067),
                    height: 1.35,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                key: const Key('city_selector_search_field'),
                controller: _searchController,
                onChanged: _filterCities,
                decoration: InputDecoration(
                  hintText: 'Buscar cidade',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(color: Color(0xFFE0E7E3)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(color: Color(0xFFE0E7E3)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(
                      color: Color(0xFF006733),
                      width: 1.4,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Flexible(child: _buildContent()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_hasError) {
      return _CitySelectorError(onRetry: _loadCities);
    }

    if (_filteredCities.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 32),
          child: Text(
            'Nenhuma cidade encontrada.',
            style: TextStyle(
              color: Color(0xFF607067),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    return ListView.separated(
      key: const Key('city_selector_city_list'),
      shrinkWrap: true,
      itemCount: _filteredCities.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final city = _filteredCities[index];
        final isSelected = city.id == widget.selectedCityId;

        return _CityTile(
          city: city,
          isSelected: isSelected,
          onTap: () => _selectCity(city),
        );
      },
    );
  }
}

class _CitySelectorError extends StatelessWidget {
  const _CitySelectorError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.wifi_off_rounded,
              color: Color(0xFF607067),
              size: 40,
            ),
            const SizedBox(height: 12),
            const Text(
              'Não foi possível carregar as cidades.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF102018),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Verifique sua conexão e tente novamente.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF607067), fontSize: 13),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              key: const Key('city_selector_retry_button'),
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF006733),
                side: const BorderSide(color: Color(0xFF006733)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CityTile extends StatelessWidget {
  const _CityTile({
    required this.city,
    required this.isSelected,
    required this.onTap,
  });

  final City city;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? const Color(0xFFE6F4EC) : Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        key: Key('city_selector_city_${city.id}'),
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  city.name,
                  style: TextStyle(
                    color: const Color(0xFF102018),
                    fontSize: 16,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  ),
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle, color: Color(0xFF006733)),
            ],
          ),
        ),
      ),
    );
  }
}
