import 'package:flutter/material.dart';

import '../features/news/data/news_detail_model.dart';
import '../features/news/presentation/pages/news_detail_page.dart';

class NewsDetailPreviewScreen extends StatelessWidget {
  const NewsDetailPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NewsDetailPage.preview(
      news: NewsDetailModel(
        id: 'nws_preview',
        title:
            'Decreto nº 1064/2025 estabelece novas diretrizes de licenciamento ambiental',
        description:
            'O Decreto nº 1064/2025 estabelece novas diretrizes para o processo de licenciamento ambiental no município, priorizando a digitalização dos processos e a redução dos prazos.\n\nA medida entra em vigor em 1º de junho de 2025, com período de adaptação de 60 dias para os processos já em andamento.',
        summary: 'Novas diretrizes para licenciamento ambiental no município.',
        type: 'DECRETO',
        linkType: 'interno',
        externalUrl: null,
        isActive: true,
        photos: [
          'https://picsum.photos/800/500?random=1',
          'https://picsum.photos/800/500?random=2',
          'https://picsum.photos/800/500?random=3',
        ],
        authorName: 'Prefeitura de Maringá',
        authorSubtitle: 'Prefeitura Municipal',
        createdAt: '2h atrás',
      ),
    );
  }
}
