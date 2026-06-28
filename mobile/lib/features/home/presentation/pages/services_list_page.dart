import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

class ServicesListPage extends StatefulWidget {
  const ServicesListPage({super.key, Dio? dio}) : _dio = dio;

  final Dio? _dio;

  @override
  State<ServicesListPage> createState() => _ServicesListPageState();
}

class _ServicesListPageState extends State<ServicesListPage> {
  late final Dio _dio = widget._dio ?? ApiClient.instance.dio;
  late Future<List<_ServiceItem>> _future = _load();

  Future<List<_ServiceItem>> _load() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/categories',
      queryParameters: const {'page': 1, 'pageSize': 100},
    );
    final rawItems = response.data?['items'] as List<dynamic>? ?? const [];
    return rawItems
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => _ServiceItem(
            name: item['name'] as String? ?? '',
            icon: item['icon'] as String? ?? '',
          ),
        )
        .toList();
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Serviços')),
      body: FutureBuilder<List<_ServiceItem>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return _RetryState(
              icon: Icons.cloud_off_outlined,
              title: 'Não foi possível carregar os serviços',
              onRetry: _refresh,
            );
          }

          final items = snapshot.data ?? const [];
          if (items.isEmpty) {
            return _RetryState(
              icon: Icons.apps_outlined,
              title: 'Nenhum serviço encontrado',
              onRetry: _refresh,
            );
          }

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  margin: EdgeInsets.zero,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE5E5E5)),
                  ),
                  child: ListTile(
                    leading: Icon(_iconFor(item.icon)),
                    title: Text(item.name),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  IconData _iconFor(String name) {
    switch (name) {
      case 'local_hospital_outlined':
      case 'medical-cross':
        return Icons.local_hospital_outlined;
      case 'school_outlined':
      case 'education':
        return Icons.school_outlined;
      case 'park_outlined':
      case 'tourism':
        return Icons.park_outlined;
      case 'directions_bus_outlined':
      case 'public-service':
        return Icons.directions_bus_outlined;
      default:
        return Icons.apps_outlined;
    }
  }
}

class _ServiceItem {
  final String name;
  final String icon;

  const _ServiceItem({required this.name, required this.icon});
}

class _RetryState extends StatelessWidget {
  const _RetryState({
    required this.icon,
    required this.title,
    required this.onRetry,
  });

  final IconData icon;
  final String title;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: const Color(0xFF006733)),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Tentar novamente')),
          ],
        ),
      ),
    );
  }
}
