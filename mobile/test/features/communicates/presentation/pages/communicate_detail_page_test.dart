import 'package:conectaparana/features/communicates/data/communicate_detail_model.dart';
import 'package:conectaparana/shared/models/author_summary.dart';
import 'package:conectaparana/features/communicates/data/communicate_repository.dart';
import 'package:conectaparana/features/communicates/presentation/pages/communicate_detail_page.dart';
import 'package:conectaparana/features/engagement/data/engagement_service.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeRepository extends CommunicateRepository {
  _FakeRepository(this.item);

  final CommunicateDetailModel item;

  @override
  Future<CommunicateDetailModel> getById(String id) async => item;
}

class _FakeEngagementService extends EngagementService {
  _FakeEngagementService() : super(Dio());

  int likeCalls = 0;
  int saveCalls = 0;

  @override
  Future<void> toggleLike({
    required String entityType,
    required String entityId,
  }) async {
    likeCalls++;
  }

  @override
  Future<void> toggleFavorite({
    required String entityType,
    required String entityId,
  }) async {
    saveCalls++;
  }
}

CommunicateDetailModel _item({bool liked = true, bool saved = true}) {
  return CommunicateDetailModel(
    id: 'cmt_1',
    title: 'Coleta de lixo será reorganizada por bairro',
    description:
        'A coleta doméstica será reorganizada a partir de segunda-feira.\n\nConfira os horários no aplicativo.',
    author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura de Curitiba'),
    isActive: true,
    photos: const [],
    likesCount: 67,
    liked: liked,
    saved: saved,
    cityName: 'Curitiba',
    stateCode: 'PR',
    category: 'Coleta de lixo',
    createdAt: DateTime(2026, 5, 8, 9, 14),
    shareCount: 19,
    highlights: const [
      'Novo cronograma entra em vigor na segunda-feira',
      'Coleta noturna nos bairros centrais',
    ],
  );
}

Widget _buildPage({
  CommunicateDetailModel? item,
  _FakeEngagementService? engagementService,
  Future<void> Function(String text)? onShare,
}) {
  return MaterialApp(
    home: CommunicateDetailPage(
      communicateId: 'cmt_1',
      repository: _FakeRepository(item ?? _item()),
      engagementService: engagementService ?? _FakeEngagementService(),
      onShare: onShare,
    ),
  );
}

void main() {
  testWidgets('renderiza todos os blocos do detalhe conforme o Figma', (
    tester,
  ) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    expect(find.text('COMUNICADO OFICIAL'), findsOneWidget);
    expect(find.text('Coleta de lixo'), findsOneWidget);
    expect(
      find.text('Coleta de lixo será reorganizada por bairro'),
      findsOneWidget,
    );
    expect(find.text('Curitiba, PR'), findsOneWidget);
    expect(find.text('8 de Maio de 2026 às 09:14'), findsOneWidget);
    expect(find.text('Prefeitura de Curitiba'), findsOneWidget);
    expect(
      find.text('Publicado em 8 de Maio de 2026 às 09:14'),
      findsOneWidget,
    );
    expect(find.text('O QUE MUDA'), findsOneWidget);
    expect(
      find.text('Novo cronograma entra em vigor na segunda-feira'),
      findsOneWidget,
    );
    expect(find.text('67'), findsOneWidget);
    expect(find.text('19'), findsOneWidget);
    expect(find.byIcon(Icons.favorite), findsOneWidget);
    expect(find.byIcon(Icons.bookmark), findsNWidgets(2));
  });

  testWidgets('bookmark do cabecalho e rodape compartilham o mesmo estado', (
    tester,
  ) async {
    final service = _FakeEngagementService();
    await tester.pumpWidget(
      _buildPage(item: _item(saved: false), engagementService: service),
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.bookmark_border), findsNWidgets(2));
    await tester.tap(find.byKey(const Key('communicate_header_save')));
    await tester.pumpAndSettle();

    expect(service.saveCalls, 1);
    expect(find.byIcon(Icons.bookmark), findsNWidgets(2));
    expect(find.byIcon(Icons.bookmark_border), findsNothing);

    await tester.tap(find.byKey(const Key('engagement_save')));
    await tester.pumpAndSettle();
    expect(service.saveCalls, 2);
    expect(find.byIcon(Icons.bookmark_border), findsNWidgets(2));
  });

  testWidgets('curtir atualiza contador e estado visual', (tester) async {
    final service = _FakeEngagementService();
    await tester.pumpWidget(
      _buildPage(item: _item(liked: false), engagementService: service),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('engagement_like')));
    await tester.pumpAndSettle();

    expect(service.likeCalls, 1);
    expect(find.byIcon(Icons.favorite), findsOneWidget);
    expect(find.text('68'), findsOneWidget);
  });

  testWidgets('compartilhar do cabecalho usa a acao real', (tester) async {
    String? sharedText;
    await tester.pumpWidget(
      _buildPage(onShare: (text) async => sharedText = text),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('communicate_header_share')));
    await tester.pump();

    expect(sharedText, contains('/share/communicate/cmt_1'));
  });

  testWidgets('botao de alerta permanece acessivel ao final da rolagem', (
    tester,
  ) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.byKey(const Key('communicate_alert_button')),
      250,
      scrollable: find.byType(Scrollable).first,
    );

    expect(find.text('Ativar alerta desta secretaria'), findsOneWidget);
  });
}
