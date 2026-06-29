class AppDateFormatter {
  AppDateFormatter._();

  static const _months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  static const _shortMonths = [
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

  static String publication(DateTime date, {DateTime? now}) {
    final local = date.toLocal();
    final reference = (now ?? DateTime.now()).toLocal();
    if (_sameDay(local, reference)) return 'Hoje, ${time(local)}';
    return '${local.day} de ${_months[local.month - 1]} de ${local.year} às ${time(local)}';
  }

  static String shortDateTime(DateTime date) {
    final local = date.toLocal();
    return '${_two(local.day)}/${_two(local.month)}/${local.year} - ${_two(local.hour)}h${_two(local.minute)}';
  }

  static String eventDate(DateTime date) {
    final local = date.toLocal();
    return '${local.day} de ${_shortMonths[local.month - 1]} · ${local.year}';
  }

  static String dayMonth(DateTime date) {
    final local = date.toLocal();
    return '${local.day} ${_shortMonths[local.month - 1]}';
  }

  static String time(DateTime date) {
    final local = date.toLocal();
    return '${_two(local.hour)}:${_two(local.minute)}';
  }

  static String timeRange(DateTime start, DateTime? end) {
    if (end == null) return time(start);
    return '${time(start)} – ${time(end)}';
  }

  static String relative(DateTime date, {DateTime? now}) {
    final reference = (now ?? DateTime.now()).toLocal();
    final diff = reference.difference(date.toLocal());
    if (diff.isNegative || diff.inMinutes < 1) return 'agora';
    if (diff.inMinutes < 60) return '${diff.inMinutes}min';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return diff.inDays == 1 ? '1 dia' : '${diff.inDays} dias';
  }

  static bool _sameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  static String _two(int value) => value.toString().padLeft(2, '0');
}
