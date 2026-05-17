import 'package:flutter/material.dart';

class AppHeader extends StatefulWidget {
  final String cityName;
  final bool hasAlert;
  final VoidCallback? onCityTap;
  final VoidCallback? onNotificationTap;
  final ValueChanged<String>? onSearch;

  const AppHeader({
    super.key,
    required this.cityName,
    this.hasAlert = false,
    this.onCityTap,
    this.onNotificationTap,
    this.onSearch,
  });

  @override
  State<AppHeader> createState() => _AppHeaderState();
}

class _AppHeaderState extends State<AppHeader> {
  bool _searchExpanded = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Cabeçalho do app',
      container: true,
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: _searchExpanded ? _buildSearchExpanded() : _buildDefault(),
      ),
    );
  }

  Widget _buildDefault() {
    return Row(
      children: [
        Image.asset('assets/images/paranalogo.png', height: 32, errorBuilder: (context, e, s) {
          return Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFF006733),
              borderRadius: BorderRadius.circular(8),
            ),
          );
        }),
        const SizedBox(width: 12),

        GestureDetector(
          onTap: widget.onCityTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF0EE),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF006733)),
                SizedBox(width: 4),
                Text(
                  'Cidade',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF006733),
                  ),
                ),
                SizedBox(width: 4),
                Icon(Icons.keyboard_arrow_down, size: 16, color: Color(0xFF006733)),
              ],
            ),
          ),
        ),

        const Spacer(),

        IconButton(
          onPressed: () => setState(() => _searchExpanded = true),
          icon: const Icon(Icons.search, color: Colors.black87),
        ),

        Stack(
          children: [
            IconButton(
              onPressed: widget.onNotificationTap,
              icon: const Icon(Icons.notifications_outlined, color: Colors.black87),
            ),
            if (widget.hasAlert)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildSearchExpanded() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            autofocus: true,
            onChanged: widget.onSearch,
            decoration: InputDecoration(
              hintText: 'Buscar serviços, comunicados...',
              filled: true,
              fillColor: const Color(0xFFFFF0EE),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              suffixIcon: IconButton(
                icon: const Icon(Icons.close, color: Colors.grey),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchExpanded = false);
                },
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF006733), width: 1.5),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF006733), width: 1.5),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF006733), width: 1.5),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
          ),
        ),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: () {
            _searchController.clear();
            setState(() => _searchExpanded = false);
          },
          child: const Text(
            'Cancelar',
            style: TextStyle(
              color: Color(0xFF006733),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}