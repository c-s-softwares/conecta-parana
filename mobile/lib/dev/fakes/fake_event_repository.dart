// DEV ONLY
// Repositório fake de eventos para testar a tela de detalhe sem backend.
// Será removido quando a integração com backend estiver pronta.

import 'package:conectaparana/features/events/data/repository/event_repository.dart';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/events/data/models/event_detail_model.dart';

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
