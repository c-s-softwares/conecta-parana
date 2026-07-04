// DEV ONLY
// Repositório fake de eventos para testar a tela de detalhe sem backend.
// Será removido quando a integração com backend estiver pronta.

import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/events/data/models/event_detail_model.dart';
import 'package:conectaparana/dev/fakes/fake_event_list.dart';

final _eventCompleto = EventDetail(
  id: 'evt_fake_completo',
  title: 'Festa Junina do Centro',
  description:
      'A maior festa junina da cidade! Venha curtir forró ao vivo, comidas típicas, '
      'quadrilha e muito mais. O evento acontece na praça central com entrada gratuita '
      'para toda a família. Traga as crianças e venha vestido a caráter!',
  type: 'Cultural',
  status: 'publicado',
  eventDate: DateTime(2026, 6, 12, 19, 0),
  cityId: 'cit_fake',
  coordinates: const EventCoordinates(lat: -23.4205, lng: -51.9331),
  local: const EventLocal(id: 'loc_fake', name: 'Praça da Liberdade'),
  photos: const [
    EventPhoto(
      id: 'pho_1',
      url: 'https://picsum.photos/seed/festa1/800/500',
      thumbUrl: 'https://picsum.photos/seed/festa1/400/250',
    ),
    EventPhoto(
      id: 'pho_2',
      url: 'https://picsum.photos/seed/festa2/800/500',
      thumbUrl: 'https://picsum.photos/seed/festa2/400/250',
    ),
    EventPhoto(
      id: 'pho_3',
      url: 'https://picsum.photos/seed/festa3/800/500',
      thumbUrl: 'https://picsum.photos/seed/festa3/400/250',
    ),
  ],
  likesCount: 42,
  likedByMe: false,
  savedByMe: false,
);

final _eventSemFotosSemMapa = EventDetail(
  id: 'evt_fake_simples',
  title: 'Palestra: Empreendedorismo Local',
  description:
      'Uma palestra sobre como abrir e manter um negócio local sustentável. '
      'Apresentação com cases de sucesso da região e sessão de perguntas e respostas.',
  type: 'Educação',
  status: 'publicado',
  eventDate: DateTime(2026, 6, 20, 14, 0),
  cityId: 'cit_fake',
  coordinates: null,
  local: null,
  photos: const [],
  likesCount: 8,
  likedByMe: true,
  savedByMe: true,
);

final _eventCancelado = EventDetail(
  id: 'evt_fake_cancelado',
  title: 'Show de Rock — CANCELADO',
  description: 'Devido a condições climáticas adversas, o show foi cancelado. '
      'Pedimos desculpas pelo inconveniente. Em breve novas datas serão divulgadas.',
  type: 'Música',
  status: 'cancelado',
  eventDate: DateTime(2026, 6, 15, 21, 0),
  cityId: 'cit_fake',
  coordinates: const EventCoordinates(lat: -23.4300, lng: -51.9400),
  local: const EventLocal(id: 'loc_fake_2', name: 'Ginásio Municipal'),
  photos: const [
    EventPhoto(
      id: 'pho_4',
      url: 'https://picsum.photos/seed/rock1/800/500',
      thumbUrl: 'https://picsum.photos/seed/rock1/400/250',
    ),
  ],
  likesCount: 120,
  likedByMe: false,
  savedByMe: false,
);

final _eventos = {
  'evt_fake_completo': _eventCompleto,
  'evt_fake_simples': _eventSemFotosSemMapa,
  'evt_fake_cancelado': _eventCancelado,
  'evt_aniversario': EventDetail(
    id: 'evt_aniversario',
    title: 'Aniversário de Maringá',
    description:
        'Comemoração oficial do aniversário da cidade, com shows, food trucks '
        'e atividades para toda a família na Praça da Catedral.',
    type: 'Cultural',
    status: 'publicado',
    eventDate: DateTime(2026, 5, 10, 18, 0),
    cityId: 'cit_fake',
    local: const EventLocal(id: 'loc_catedral', name: 'Praça da Catedral'),
    photos: const [
      EventPhoto(
        id: 'pho_aniversario',
        url: 'https://picsum.photos/seed/aniversario/800/500',
        thumbUrl: 'https://picsum.photos/seed/aniversario/400/250',
      ),
    ],
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
  ),
  'evt_festival_nipo': EventDetail(
    id: 'evt_festival_nipo',
    title: 'Festival Nipo-Brasileiro',
    description:
        'Festival que celebra a cultura japonesa na cidade, com gastronomia, '
        'apresentações culturais e exposições no Parque do Ingá.',
    type: 'Cultural',
    status: 'publicado',
    eventDate: DateTime(2026, 5, 15, 0, 0),
    eventEndDate: DateTime(2026, 5, 17, 23, 59),
    cityId: 'cit_fake',
    local: const EventLocal(id: 'loc_inga', name: 'Parque do Ingá'),
    photos: const [
      EventPhoto(
        id: 'pho_nipo',
        url: 'https://picsum.photos/seed/festivalnipo/800/500',
        thumbUrl: 'https://picsum.photos/seed/festivalnipo/400/250',
      ),
    ],
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
  ),
  'evt_feira_organica': EventDetail(
    id: 'evt_feira_organica',
    title: 'Feira Orgânica do Parque',
    description:
        'Feira semanal de produtos orgânicos, com produtores locais, '
        'realizada toda quarta-feira no Parque dos Pioneiros.',
    type: 'Feira',
    status: 'publicado',
    eventDate: DateTime(2026, 5, 13, 7, 0),
    cityId: 'cit_fake',
    local: const EventLocal(id: 'loc_pioneiros', name: 'Parque dos Pioneiros'),
    photos: const [],
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
  ),
  'evt_audiencia_orcamento': EventDetail(
    id: 'evt_audiencia_orcamento',
    title: 'Audiência pública — Orçamento 2026',
    description:
        'Audiência pública para discussão do orçamento municipal de 2026, '
        'aberta à participação popular na Câmara Municipal.',
    type: 'Educação',
    status: 'publicado',
    eventDate: DateTime(2026, 5, 12, 19, 0),
    cityId: 'cit_fake',
    local: const EventLocal(id: 'loc_camara', name: 'Câmara Municipal'),
    photos: const [],
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
  ),
  'evt_corrida_trabalhador': EventDetail(
    id: 'evt_corrida_trabalhador',
    title: 'Corrida do Trabalhador',
    description:
        'Corrida tradicional realizada no feriado do Dia do Trabalhador, '
        'com percurso pela Av. Brasil e largada gratuita.',
    type: 'Esporte',
    status: 'publicado',
    eventDate: DateTime(2026, 5, 18, 7, 30),
    cityId: 'cit_fake',
    local: const EventLocal(id: 'loc_avbrasil', name: 'Av. Brasil'),
    photos: const [],
    likesCount: 0,
    likedByMe: false,
    savedByMe: false,
  ),
};

class FakeEventRepository implements EventRepository {
  final Duration delay;

  final bool simulateNetworkError;

  final bool simulateNotFound;

  const FakeEventRepository({
    this.delay = const Duration(milliseconds: 800),
    this.simulateNetworkError = false,
    this.simulateNotFound = false,
  });

  @override
  Future<EventListPage> getEvents({
    String? cityId,
    DateTime? from,
    DateTime? to,
    int page = 1,
    int pageSize = 10,
  }) async {
    await Future.delayed(delay);
    if (simulateNetworkError) {
      throw DioException(
        requestOptions: RequestOptions(path: '/events'),
        type: DioExceptionType.connectionError,
      );
    }

    return EventListPage(
      items: fakeEventListItems,
      total: fakeEventListItems.length,
      page: page,
      pageSize: pageSize,
    );
  }

  @override
  Future<EventDetail> getEvent(String id) async {
    await Future.delayed(delay);

    if (simulateNetworkError) {
      throw DioException(
        requestOptions: RequestOptions(path: '/events/$id'),
        type: DioExceptionType.connectionError,
      );
    }

    final event = _eventos[id];
    if (event == null || simulateNotFound) {
      final requestOptions = RequestOptions(path: '/events/$id');
      throw DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 404,
          data: {'code': 'event_not_found', 'message': 'Evento não encontrado'},
        ),
        type: DioExceptionType.badResponse,
      );
    }

    return event;
  }

  @override
  Future<EngagementResult> toggleLike(String id) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final event = _eventos[id];
    final wasLiked = event?.likedByMe ?? false;
    final currentCount = event?.likesCount ?? 0;
    return EngagementResult(
      active: !wasLiked,
      count: !wasLiked ? currentCount + 1 : currentCount - 1,
    );
  }

  @override
  Future<EngagementResult> toggleFavorite(String id) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final event = _eventos[id];
    final wasSaved = event?.savedByMe ?? false;
    return EngagementResult(active: !wasSaved);
  }
}
