import 'package:conectaparana/core/shell/shell_tab.dart';
import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:conectaparana/shared/widgets/feedback/offline_banner.dart';

class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  void _onTabTap(int index) {
    final currentIndex = navigationShell.currentIndex;

    if (index == currentIndex) {
      navigationShell.goBranch(index, initialLocation: true);
      return;
    }
    navigationShell.goBranch(index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: navigationShell),
        ],
      ),
      bottomNavigationBar: _ShellBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: _onTabTap,
      ),
    );
  }
}

class _ShellBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _ShellBottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Navegação principal',
      container: true,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFEEEEEE), width: 1)),
        ),
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
          items: ShellTab.values.map((tab) {
            return BottomNavigationBarItem(
              icon: _BadgeSlot(
                tab: tab,
                child: _buildIcon(tab.icon, active: false),
              ),
              activeIcon: _BadgeSlot(
                tab: tab,
                child: _buildActiveIcon(tab.icon),
              ),
              label: tab.label,
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildIcon(IconData icon, {required bool active}) {
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

class _BadgeSlot extends StatelessWidget {
  final ShellTab tab;
  final Widget child;

  final int? badgeCount;
  
  // ignore: unused_element_parameter
  const _BadgeSlot({required this.tab, required this.child, this.badgeCount});

  @override
  Widget build(BuildContext context) {
    if (badgeCount == null) return child;

    return Badge(
      label: badgeCount! > 0 ? Text('$badgeCount') : null,
      backgroundColor: AppTheme.primaryGreen,
      child: child,
    );
  }
}
