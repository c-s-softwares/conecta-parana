import 'package:flutter/material.dart';

import '../../data/communicate_detail_model.dart';
import '../widgets/archived_banner.dart';
import '../widgets/communicate_header_card.dart';
import '../widgets/communicate_photo_carousel.dart';
import '../widgets/communicate_engagement_bar.dart';
import '../widgets/communicate_error_state.dart';
import '../widgets/communicate_loading_state.dart';
import '../widgets/communicate_not_found_state.dart';
import '../widgets/communicate_author_section.dart';
import 'package:conectaparana/core/constants/app_spacing.dart';

enum CommunicateDetailStatus { loading, success, error, notFound }

class CommunicateDetailPage extends StatefulWidget {
  final String communicateId;
  final bool showMockPhotos;

  const CommunicateDetailPage({
    super.key,
    required this.communicateId,
    this.showMockPhotos = true,
  });

  @override
  State<CommunicateDetailPage> createState() => _CommunicateDetailPageState();
}

class _CommunicateDetailPageState extends State<CommunicateDetailPage> {
  CommunicateDetailStatus status = CommunicateDetailStatus.success;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (status == CommunicateDetailStatus.loading) {
      return const Scaffold(body: CommunicateLoadingState());
    }

    if (status == CommunicateDetailStatus.error) {
      return Scaffold(
        body: CommunicateErrorState(
          onRetry: () {
            setState(() {
              status = CommunicateDetailStatus.success;
            });
          },
        ),
      );
    }

    if (status == CommunicateDetailStatus.notFound) {
      return const Scaffold(body: CommunicateNotFoundState());
    }
    final communicate = CommunicateDetailModel(
      id: 'communicateId',
      title: 'Coleta de lixo será reorganizada por bairro a partir de segunda',
      description:
          'A Secretaria de Obras e Serviços Públicos informa que o cronograma de coleta doméstica será reorganizado a partir do dia 12 de maio.\n\n'
          'Os moradores devem verificar o novo horário do seu bairro pelo aplicativo Conecta Paraná.',
      authorName: 'Prefeitura de Curitiba',
      city: 'Curitiba, PR',
      publishedAt: DateTime.now(),
      isActive: false,
      photos: widget.showMockPhotos
          ? [
              'https://images.unsplash.com/photo-1604187351574-c75ca79f5807',
              'https://images.unsplash.com/photo-1494526585095-c41746248156',
            ]
          : [],
    );

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.bookmark_border)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.share_outlined)),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (communicate.photos.isNotEmpty) ...[
              CommunicatePhotoCarousel(photos: communicate.photos),
              AppSpacing.md,
            ],

            if (!communicate.isActive) ...[
              const ArchivedBanner(),
              AppSpacing.md,
            ],
            const CommunicateHeaderCard(),

            AppSpacing.md,

            CommunicateAuthorSection(authorName: communicate.authorName),

            AppSpacing.md,

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF163020)
                    : const Color(0xFFCFEAD8),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DefaultTextStyle.merge(
                style: TextStyle(
                  color: isDark
                      ? Colors.green.shade100
                      : const Color(0xFF14532D),
                  fontWeight: FontWeight.w500,
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'O QUE MUDA',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0B7A3B),
                      ),
                    ),
                    SizedBox(height: 12),
                    Text('• Novo cronograma entra em vigor na segunda-feira'),
                    SizedBox(height: 8),
                    Text('• Coleta noturna em bairros centrais'),
                    SizedBox(height: 8),
                    Text('• Retire o lixo somente após 20h'),
                  ],
                ),
              ),
            ),

            AppSpacing.md,

            Text(
              communicate.description,
              softWrap: true,
              style: TextStyle(
                fontSize: 16,
                height: 1.7,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),

            AppSpacing.md,

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.notifications_none),
                label: const Text('Ativar alerta desta secretaria'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDark
                      ? const Color(0xFF14532D)
                      : const Color(0xFF0B7A3B),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ),
            AppSpacing.md,
            const Divider(
              color: Color.fromARGB(255, 236, 236, 236),
              thickness: 1,
            ),
            AppSpacing.md,
            const CommunicateEngagementBar(),
          ],
        ),
      ),
    );
  }
}
