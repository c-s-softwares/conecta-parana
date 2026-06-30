import 'package:conectaparana/features/news/data/news_detail_model.dart';
import 'package:conectaparana/features/news/presentation/pages/news_detail_page.dart';
import 'package:conectaparana/shared/models/author_summary.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget makeTestableWidget(NewsDetailModel news) {
    return MaterialApp(home: NewsDetailPage.preview(news: news));
  }

  testWidgets('deve exibir detalhe de notícia interna', (tester) async {
    final news = NewsDetailModel(
      id: 'nws_1',
      title: 'Título da notícia',
      description: 'Descrição completa da notícia',
      summary: 'Resumo da notícia',
      type: 'DECRETO',
      linkType: 'interno',
      externalUrl: null,
      isActive: true,
      photos: [],
      author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura de Maringá'),
      createdAt: '2h atrás',
    );

    await tester.pumpWidget(makeTestableWidget(news));
    await tester.pumpAndSettle();

    expect(find.text('Título da notícia'), findsOneWidget);
    expect(find.text('Descrição completa da notícia'), findsOneWidget);
    expect(find.text('DECRETO'), findsOneWidget);
    expect(find.text('Prefeitura de Maringá'), findsOneWidget);
    expect(find.text('Ler matéria completa'), findsNothing);
  });

  testWidgets('deve exibir botão de matéria completa quando link for externo', (
    tester,
  ) async {
    final news = NewsDetailModel(
      id: 'nws_2',
      title: 'Notícia externa',
      description: 'Descrição',
      summary: 'Resumo',
      type: 'DECRETO',
      linkType: 'externo',
      externalUrl: 'https://flutter.dev',
      isActive: true,
      photos: [],
      author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura Municipal'),
      createdAt: '1h atrás',
    );

    await tester.pumpWidget(makeTestableWidget(news));
    await tester.pumpAndSettle();

    expect(find.text('Ler matéria completa'), findsOneWidget);
  });

  testWidgets('deve exibir banner quando notícia estiver arquivada', (
    tester,
  ) async {
    final news = NewsDetailModel(
      id: 'nws_3',
      title: 'Titulo arquivado',
      description: 'Descrição',
      summary: 'Resumo',
      type: 'DECRETO',
      linkType: 'interno',
      externalUrl: null,
      isActive: false,
      photos: [],
      author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura Municipal'),
      createdAt: '1h atrás',
    );

    await tester.pumpWidget(makeTestableWidget(news));
    await tester.pumpAndSettle();

    expect(find.text('Notícia arquivada'), findsOneWidget);
  });

  testWidgets('não deve exibir botão quando link externo for nulo', (
    tester,
  ) async {
    final news = NewsDetailModel(
      id: 'nws_4',
      title: 'Notícia externa sem URL',
      description: 'Descrição',
      summary: 'Resumo',
      type: 'DECRETO',
      linkType: 'externo',
      externalUrl: null,
      isActive: true,
      photos: [],
      author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura Municipal'),
      createdAt: '1h atrás',
    );

    await tester.pumpWidget(makeTestableWidget(news));
    await tester.pumpAndSettle();

    expect(find.text('Ler matéria completa'), findsNothing);
  });

  testWidgets('deve exibir carousel quando houver fotos', (tester) async {
    final news = NewsDetailModel(
      id: 'nws_5',
      title: 'Notícia com fotos',
      description: 'Descrição',
      summary: 'Resumo',
      type: 'DECRETO',
      linkType: 'interno',
      externalUrl: null,
      isActive: true,
      photos: ['https://picsum.photos/800/500?1'],
      author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura Municipal'),
      createdAt: '1h atrás',
    );

    await tester.pumpWidget(makeTestableWidget(news));
    await tester.pumpAndSettle();

    expect(find.byType(PageView), findsOneWidget);
  });

  testWidgets('deve exibir empty state quando notícia não for encontrada', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: Text('Notícia não encontrada'))),
    );

    await tester.pumpAndSettle();

    expect(find.text('Notícia não encontrada'), findsOneWidget);
  });

  testWidgets('deve exibir estado de erro quando falhar o carregamento', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              const Text('Não foi possível carregar a notícia.'),
              ElevatedButton(
                onPressed: () {},
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Não foi possível carregar a notícia.'), findsOneWidget);
    expect(find.text('Tentar novamente'), findsOneWidget);
  });

  testWidgets(
    'deve exibir botão de matéria completa quando houver URL externa',
    (tester) async {
      final news = NewsDetailModel(
        id: 'nws_6',
        title: 'Notícia externa',
        description: 'Descrição',
        summary: 'Resumo',
        type: 'DECRETO',
        linkType: 'externo',
        externalUrl: 'https://google.com',
        isActive: true,
        photos: [],
        author: const AuthorSummary(id: 'usr_1', name: 'Prefeitura Municipal'),
        createdAt: '1h atrás',
      );

      await tester.pumpWidget(makeTestableWidget(news));
      await tester.pumpAndSettle();

      expect(find.text('Ler matéria completa'), findsOneWidget);
    },
  );
}
