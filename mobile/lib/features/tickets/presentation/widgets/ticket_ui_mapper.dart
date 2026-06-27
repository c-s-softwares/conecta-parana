import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/misc/badge.dart';

enum TicketStatusGroup { aberto, emAnalise, respondido, concluido }

class TicketUiMapper {
  TicketUiMapper._();

  static const Map<String, String> _typeLabels = {
    'acidente': 'Acidente',
    'sinalizacao': 'Sinalização',
    'sinalização': 'Sinalização',
    'iluminacao': 'Iluminação',
    'iluminação': 'Iluminação',
    'lixo': 'Lixo',
    'outros': 'Outros',
  };

  static const Map<String, IconData> _typeIcons = {
    'acidente': Icons.car_crash_outlined,
    'sinalizacao': Icons.traffic_outlined,
    'sinalização': Icons.traffic_outlined,
    'iluminacao': Icons.lightbulb_outline,
    'iluminação': Icons.lightbulb_outline,
    'lixo': Icons.delete_outline,
    'outros': Icons.report_outlined,
  };

  static const Map<String, Color> _typeColors = {
    'acidente': Color(0xFFE53935),
    'sinalizacao': Color(0xFF1565C0),
    'sinalização': Color(0xFF1565C0),
    'iluminacao': Color(0xFFD4820A),
    'iluminação': Color(0xFFD4820A),
    'lixo': Color(0xFF006733),
    'outros': Color(0xFF9E9E9E),
  };

  static String typeLabel(String type) => _typeLabels[type] ?? type;

  static IconData typeIcon(String type) =>
      _typeIcons[type] ?? Icons.help_outline;

  static Color typeColor(String type) =>
      _typeColors[type] ?? const Color(0xFF9E9E9E);

  static TicketStatusGroup statusGroup(String status) {
    switch (status) {
      case 'aberto':
        return TicketStatusGroup.aberto;
      case 'em_analise':
        return TicketStatusGroup.emAnalise;
      case 'reaberto':
        return TicketStatusGroup.respondido;
      case 'resolvido':
      case 'fechado':
        return TicketStatusGroup.concluido;
      default:
        return TicketStatusGroup.concluido;
    }
  }

  static String statusGroupLabel(TicketStatusGroup group) {
    switch (group) {
      case TicketStatusGroup.aberto:
        return 'Aberto';
      case TicketStatusGroup.emAnalise:
        return 'Em análise';
      case TicketStatusGroup.respondido:
        return 'Respondido';
      case TicketStatusGroup.concluido:
        return 'Concluído';
    }
  }

  static String statusLabel(String status) =>
      statusGroupLabel(statusGroup(status));

  static AppBadgeVariant statusVariant(String status) {
    switch (statusGroup(status)) {
      case TicketStatusGroup.aberto:
        return AppBadgeVariant.purple;
      case TicketStatusGroup.emAnalise:
        return AppBadgeVariant.orange;
      case TicketStatusGroup.respondido:
        return AppBadgeVariant.orange;
      case TicketStatusGroup.concluido:
        return AppBadgeVariant.teal;
    }
  }



  static String statusExactLabel(String status) {
    switch (status) {
      case 'aberto':
        return 'Aberto';
      case 'em_analise':
        return 'Em análise';
      case 'resolvido':
        return 'Resolvido';
      case 'fechado':
        return 'Fechado';
      case 'reaberto':
        return 'Reaberto';
      default:
        return status;
    }
  }

  static AppBadgeVariant statusExactVariant(String status) {
    switch (status) {
      case 'aberto':
        return AppBadgeVariant.purple;
      case 'em_analise':
        return AppBadgeVariant.orange;
      case 'resolvido':
        return AppBadgeVariant.teal;
      case 'fechado':
        return AppBadgeVariant.grey;
      case 'reaberto':
        return AppBadgeVariant.blue;
      default:
        return AppBadgeVariant.grey;
    }
  }

  static String formatDateTime(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = _months[date.month - 1];
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$day $month · $hour:$minute';
  }

  static const _months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];

  static String formatShortDate(DateTime date) {
    return '${date.day} ${_months[date.month - 1]}';
  }

  static String formatRelative(DateTime date, {DateTime? now}) {
    final reference = now ?? DateTime.now();
    final diff = reference.difference(date);

    if (diff.inMinutes < 60) {
      final minutes = diff.inMinutes < 1 ? 1 : diff.inMinutes;
      return '${minutes}min';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours}h';
    }
    final days = diff.inDays;
    return days == 1 ? '1 dia' : '$days dias';
  }
}
