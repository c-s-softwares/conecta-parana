// DEV ONLY
// Dados mockados para as seções de destaque da Home (alerta, banner em
// destaque, grade de serviços e carrossel de eventos próximos).
// Será substituído pela integração com o backend real quando disponível.

import 'package:conectaparana/features/home/domain/entities/home_highlights.dart';
import 'package:conectaparana/features/events/domain/entities/event_list_item.dart';

final fakeHomeHighlights = HomeHighlights(
  alert: const HomeAlert(
    title: 'Alagamento na Av. Brasil',
    description:
        'Trecho entre Av. Cerro Azul e Centro interditado. Evite a região.',
    timeLabel: 'agora',
  ),
  featuredBanner: const HomeFeaturedBanner(
    id: 'dec_1064_2025',
    tags: ['DECRETO', 'Meio ambiente'],
    highlightText: 'DECRETO Nº 1064/2025',
    title: 'Entenda o Decreto nº 1064/2025 sobre o licenciamento ambiental',
    authorName: 'Prefeitura de Maringá',
    timeLabel: '2h',
    detailRoute: '/home/comunicado/dec_1064_2025',
  ),
  services: [
    const HomeService(id: 'ubs', label: 'UBS', icon: 'local_hospital_outlined', route: '/map'),
    const HomeService(id: 'escolas', label: 'Escolas', icon: 'school_outlined', route: '/map'),
    const HomeService(id: 'parques', label: 'Parques', icon: 'park_outlined', route: '/map'),
    const HomeService(id: 'transporte', label: 'Transporte', icon: 'directions_bus_outlined', route: '/map'),
    const HomeService(id: 'iptu', label: 'IPTU', icon: 'receipt_long_outlined', route: '/profile'),
    const HomeService(id: 'iluminacao', label: 'Iluminação', icon: 'lightbulb_outline', route: '/map'),
    const HomeService(id: 'coleta', label: 'Coleta', icon: 'delete_outline', route: '/map'),
    const HomeService(id: 'docs', label: 'Docs', icon: 'description_outlined', route: '/profile'),
  ],
  events: [
    EventListItem(
      id: 'evt_aniversario',
      title: 'Aniversário da cidade',
      category: 'evento',
      date: DateTime(2026, 5, 10),
      dateLabel: '10 MAI',
      time: '00:00',
      location: 'Praça da Catedral',
      gradientColors: ['0xFF1B3A66', '0xFF274B82'],
      detailRoute: '/events/evt_aniversario',
    ),
    EventListItem(
      id: 'evt_festival_nipo',
      title: 'Festival Nipo',
      category: 'evento',
      date: DateTime(2026, 5, 15),
      dateLabel: '15–17 MAI',
      time: '00:00',
      location: 'Parque do Ingá',
      gradientColors: ['0xFFB3215A', '0xFF6E1640'],
      detailRoute: '/events/evt_festival_nipo',
    ),
    EventListItem(
      id: 'evt_feira_organica',
      title: 'Parque do Ingá',
      category: 'evento',
      date: DateTime(2026, 5, 20),
      dateLabel: 'TODA QUARTA',
      time: '07:00',
      location: 'Parque dos Pioneiros',
      gradientColors: ['0xFF2E7D32', '0xFF1B5E20'],
      detailRoute: '/events/evt_feira_organica',
    ),
  ],
);
