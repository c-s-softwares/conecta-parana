import 'package:conectaparana/features/engagement/data/engagement_service.dart';
import 'package:conectaparana/features/engagement/widgets/engagement_bar.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeEngagementService extends EngagementService {
  FakeEngagementService() : super(Dio());

  bool shouldFailLikeNotFound = false;

  Duration saveDelay = Duration.zero;

  int likeCalls = 0;
  int saveCalls = 0;

  bool shouldFailLike = false;
  bool shouldFailSave = false;
  Duration delay = Duration.zero;

  @override
  Future<void> toggleLike({
    required String entityType,
    required String entityId,
  }) async {
    likeCalls++;

    if (delay != Duration.zero) {
      await Future.delayed(delay);
    }

    if (shouldFailLikeNotFound) {
      throw EngagementException('Conteúdo não encontrado.');
    }

    if (shouldFailLike) {
      throw Exception('network');
    }
  }

  @override
  Future<void> toggleFavorite({
    required String entityType,
    required String entityId,
  }) async {
    saveCalls++;

    if (saveDelay != Duration.zero) {
      await Future.delayed(saveDelay);
    }

    if (shouldFailSave) {
      throw Exception('network');
    }
  }
}

Widget createWidget({
  required EngagementService service,
  String entityType = 'news',
  bool liked = false,
  bool saved = false,
  Future<void> Function(String text)? onShare,
}) {
  return MaterialApp(
    home: Scaffold(
      body: EngagementBar(
        entityType: entityType,
        entityId: 'news_1',
        liked: liked,
        saved: saved,
        likesCount: 12,
        service: service,
        onShare: onShare,
      ),
    ),
  );
}

void main() {
  testWidgets('inicia com estados ativos recebidos da API', (tester) async {
    final service = FakeEngagementService();

    await tester.pumpWidget(
      createWidget(service: service, liked: true, saved: true),
    );

    expect(find.byIcon(Icons.favorite), findsOneWidget);
    expect(find.byIcon(Icons.bookmark), findsOneWidget);
    expect(find.byIcon(Icons.favorite_border), findsNothing);
    expect(find.byIcon(Icons.bookmark_border), findsNothing);
  });

  testWidgets('toggle like updates UI', (tester) async {
    final service = FakeEngagementService();

    await tester.pumpWidget(createWidget(service: service));

    await tester.tap(find.byIcon(Icons.favorite_border));
    await tester.pump();

    expect(find.byIcon(Icons.favorite), findsOneWidget);
    expect(find.text('13'), findsOneWidget);
    expect(service.likeCalls, 1);
  });

  testWidgets('toggle save updates UI', (tester) async {
    final service = FakeEngagementService();

    await tester.pumpWidget(createWidget(service: service));

    await tester.tap(find.byIcon(Icons.bookmark_border));
    await tester.pump();

    expect(find.byIcon(Icons.bookmark), findsOneWidget);
    expect(service.saveCalls, 1);
  });

  testWidgets('hides like button when entityType is local', (tester) async {
    final service = FakeEngagementService();

    await tester.pumpWidget(
      createWidget(service: service, entityType: 'local'),
    );

    expect(find.byIcon(Icons.favorite_border), findsNothing);
    expect(find.byIcon(Icons.bookmark_border), findsOneWidget);
    expect(find.byIcon(Icons.share_outlined), findsOneWidget);
  });

  testWidgets('reverts like UI when request fails', (tester) async {
    final service = FakeEngagementService()..shouldFailLike = true;

    await tester.pumpWidget(createWidget(service: service));

    await tester.tap(find.byIcon(Icons.favorite_border));
    await tester.pump();

    expect(find.byIcon(Icons.favorite_border), findsOneWidget);
    expect(find.text('12'), findsOneWidget);
    expect(find.text('Sem conexão. Tente novamente.'), findsOneWidget);
    expect(service.likeCalls, 1);
  });

  testWidgets('ignores double tap while like request is in flight', (
    tester,
  ) async {
    final service = FakeEngagementService()
      ..delay = const Duration(milliseconds: 300);

    await tester.pumpWidget(createWidget(service: service));

    await tester.tap(find.byIcon(Icons.favorite_border));
    await tester.pump();

    await tester.tap(find.byKey(const Key('engagement_like')));
    await tester.pump();

    expect(service.likeCalls, 1);

    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump();
  });

  testWidgets('shares text with expected URL', (tester) async {
    final service = FakeEngagementService();
    String? sharedText;

    await tester.pumpWidget(
      createWidget(
        service: service,
        onShare: (text) async {
          sharedText = text;
        },
      ),
    );

    await tester.tap(find.byIcon(Icons.share_outlined));
    await tester.pump();

    expect(
      sharedText,
      'Confira no Conecta Paraná: https://conectaparana.app/share/news/news_1',
    );
  });

  testWidgets('shows not found message when like returns 404', (tester) async {
    final service = FakeEngagementService()..shouldFailLikeNotFound = true;

    await tester.pumpWidget(createWidget(service: service));

    await tester.tap(find.byIcon(Icons.favorite_border));
    await tester.pump();

    expect(find.byIcon(Icons.favorite_border), findsOneWidget);
    expect(find.text('12'), findsOneWidget);
    expect(find.text('Conteúdo não encontrado.'), findsOneWidget);
  });

  testWidgets('ignores double tap while save request is in flight', (
    tester,
  ) async {
    final service = FakeEngagementService()
      ..saveDelay = const Duration(milliseconds: 300);

    await tester.pumpWidget(createWidget(service: service));

    await tester.tap(find.byIcon(Icons.bookmark_border));
    await tester.pump();

    await tester.tap(find.byKey(const Key('engagement_save')));
    await tester.pump();

    expect(service.saveCalls, 1);

    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump();
  });

  testWidgets('shows snackbar when share fails', (tester) async {
    final service = FakeEngagementService();

    await tester.pumpWidget(
      createWidget(
        service: service,
        onShare: (_) async {
          throw Exception('share unavailable');
        },
      ),
    );

    await tester.tap(find.byIcon(Icons.share_outlined));
    await tester.pump();

    expect(find.text('Compartilhamento não disponível.'), findsOneWidget);
  });
}
