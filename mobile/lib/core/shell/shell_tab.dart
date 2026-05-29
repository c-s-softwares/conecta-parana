import 'package:flutter/material.dart';

enum ShellTab {
  home,
  events,
  map,
  tickets,
  profile;

  String get label {
    switch (this) {
      case ShellTab.home:
        return 'Início';
      case ShellTab.events:
        return 'Eventos';
      case ShellTab.map:
        return 'Mapa';
      case ShellTab.tickets:
        return 'Tickets';
      case ShellTab.profile:
        return 'Perfil';
    }
  }

  IconData get icon {
    switch (this) {
      case ShellTab.home:
        return Icons.home_outlined;
      case ShellTab.events:
        return Icons.calendar_today_outlined;
      case ShellTab.map:
        return Icons.map_outlined;
      case ShellTab.tickets:
        return Icons.confirmation_number_outlined;
      case ShellTab.profile:
        return Icons.person_outline;
    }
  }

  String get rootPath {
    switch (this) {
      case ShellTab.home:
        return '/home';
      case ShellTab.events:
        return '/events';
      case ShellTab.map:
        return '/map';
      case ShellTab.tickets:
        return '/tickets';
      case ShellTab.profile:
        return '/profile';
    }
  }

  static ShellTab? fromPath(String path) {
    for (final tab in values) {
      if (path.startsWith(tab.rootPath)) return tab;
    }
    return null;
  }
}
