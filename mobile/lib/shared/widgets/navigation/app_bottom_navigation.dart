import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:flutter/material.dart';

class AppBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const AppBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Navegação principal',
      container: true,
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: onTap,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        elevation: 0,

        selectedItemColor: AppTheme.primaryGreen,
        unselectedItemColor: Colors.black87,

        selectedFontSize: 12,
        unselectedFontSize: 12,

        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400),

        showSelectedLabels: true,
        showUnselectedLabels: true,

        items: [
          BottomNavigationBarItem(
            icon: _buildIcon(Icons.home_outlined),
            activeIcon: _buildActiveIcon(Icons.home_outlined),
            label: 'Início',
          ),
          BottomNavigationBarItem(
            icon: _buildIcon(Icons.calendar_today_outlined),
            activeIcon: _buildActiveIcon(Icons.calendar_today_outlined),
            label: 'Eventos',
          ),
          BottomNavigationBarItem(
            icon: _buildIcon(Icons.map_outlined),
            activeIcon: _buildActiveIcon(Icons.map_outlined),
            label: 'Mapa',
          ),
          BottomNavigationBarItem(
            icon: _buildIcon(Icons.confirmation_number_outlined),
            activeIcon: _buildActiveIcon(Icons.confirmation_number_outlined),
            label: 'Tickets',
          ),
          BottomNavigationBarItem(
            icon: _buildIcon(Icons.person_outline),
            activeIcon: _buildActiveIcon(Icons.person_outline),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }

  Widget _buildIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Icon(icon, color: Colors.black87),
    );
  }

  Widget _buildActiveIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.inputBackground,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Icon(icon, color: Colors.black87),
    );
  }
} 