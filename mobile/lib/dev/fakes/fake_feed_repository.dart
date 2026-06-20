// DEV ONLY
// Repositório fake do feed para testar a seção "Mais comunicados" da Home
// sem backend. Será removido quando a integração com backend estiver pronta.

import 'package:conectaparana/features/home/domain/entities/feed_item.dart';
import 'package:conectaparana/features/home/domain/entities/feed_page.dart';
import 'package:conectaparana/features/home/domain/repositories/feed_repository.dart';

final _fakeFeedItems = <FeedItem>[
  const FeedItem(
    id: 'com_orcamento_2026',
    type: FeedItemType.comunicado,
    title: 'Audiência pública sobre o orçamento de 2026 acontece dia 12',
    subtitle: 'Câmara Municipal · 5h',
    category: 'Participação',
  ),
  const FeedItem(
    id: 'news_mutirao_limpeza',
    type: FeedItemType.news,
    title: 'Mutirão de limpeza nos rios urbanos retira 8 toneladas de resíduos',
    subtitle: 'Secretaria do Meio Ambiente · 1d',
    category: 'Sustentabilidade',
  ),
];

class FakeFeedRepository implements FeedRepository {
  const FakeFeedRepository();

  @override
  Future<FeedPage> getFeed({
    required String cityId,
    double? lat,
    double? lng,
    String? cursor,
    int limit = 20,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));

    if (cursor != null) {
      return const FeedPage(items: [], hasMore: false);
    }

    return FeedPage(items: _fakeFeedItems, hasMore: false);
  }
}
