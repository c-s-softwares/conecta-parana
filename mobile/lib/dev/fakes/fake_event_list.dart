// DEV ONLY
// Dados mockados para a tela de Eventos.
// Será substituído pela integração com o backend real quando disponível.

import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';

final fakeEventListItems = <EventListItem>[
  EventListItem(
    id: 'evt_aniversario',
    title: 'Aniversário de Maringá',
    category: 'CULTURA',
    date: DateTime(2026, 5, 10, 18, 0),
    time: '18:00',
    location: 'Praça da Catedral',
    isFree: true,
    isFeatured: true,
    gradientColors: const ['0xFFB3215A', '0xFF6E1640'],
    detailRoute: '/events/evt_aniversario',
  ),
  EventListItem(
    id: 'evt_festival_nipo',
    title: 'Festival Nipo-Brasileiro',
    category: 'CULTURA',
    date: DateTime(2026, 5, 15, 0, 0),
    dateLabel: 'Todo dia',
    time: 'Todo dia',
    location: 'Parque do Ingá',
    isFree: true,
    gradientColors: const ['0xFF3F2B96', '0xFF1E2A78'],
    detailRoute: '/events/evt_festival_nipo',
  ),
  EventListItem(
    id: 'evt_feira_organica',
    title: 'Feira Orgânica do Parque',
    category: 'FEIRA',
    date: DateTime(2026, 5, 13, 7, 0),
    dateLabel: 'Toda quarta',
    time: '07:00',
    location: 'Parque dos Pioneiros',
    isFree: true,
    gradientColors: const ['0xFF2E7D32', '0xFF1B5E20'],
    detailRoute: '/events/evt_feira_organica',
  ),
  EventListItem(
    id: 'evt_audiencia_orcamento',
    title: 'Audiência pública — Orçamento 2026',
    category: 'EDUCAÇÃO',
    date: DateTime(2026, 5, 12, 19, 0),
    time: '19:00',
    location: 'Câmara Municipal',
    gradientColors: const ['0xFF006733', '0xFF004D26'],
    detailRoute: '/events/evt_audiencia_orcamento',
  ),
  EventListItem(
    id: 'evt_corrida_trabalhador',
    title: 'Corrida do Trabalhador',
    category: 'ESPORTE',
    date: DateTime(2026, 5, 18, 7, 30),
    time: '07:30',
    location: 'Av. Brasil',
    isFree: true,
    gradientColors: const ['0xFFD4820A', '0xFF8A5306'],
    detailRoute: '/events/evt_corrida_trabalhador',
  ),
];
