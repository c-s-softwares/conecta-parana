import 'package:flutter/material.dart';
import 'package:conectaparana/core/formatters/app_date_formatter.dart';

import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/misc/avatar.dart';
import '../../../engagement/data/engagement_service.dart';
import '../../../engagement/widgets/engagement_bar.dart';
import '../../data/news_detail_model.dart';
import '../../data/news_repository.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/news_photo_carousel.dart';

class NewsDetailPage extends StatefulWidget {
  final String id;
  final NewsDetailModel? previewNews;

  const NewsDetailPage({super.key, required this.id}) : previewNews = null;

  NewsDetailPage.preview({super.key, required NewsDetailModel news})
    : id = news.id,
      previewNews = news;
  @override
  State<NewsDetailPage> createState() => _NewsDetailPageState();
}

class _NewsDetailPageState extends State<NewsDetailPage> {
  Future<void> _openExternalUrl(String url) async {
    final uri = Uri.tryParse(url);

    if (uri == null) {
      _showLinkError();
      return;
    }

    try {
      final opened = await launchUrl(uri, mode: LaunchMode.platformDefault);

      if (!opened) {
        _showLinkError();
      }
    } catch (_) {
      _showLinkError();
    }
  }

  void _showLinkError() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Não foi possível abrir o link.')),
    );
  }

  late final NewsRepository _repository;
  late Future<NewsDetailModel> _future;

  @override
  void initState() {
    super.initState();

    _repository = NewsRepository(ApiClient.instance);

    if (widget.previewNews != null) {
      _future = Future.value(widget.previewNews);
    } else {
      _future = _repository.getById(widget.id);
    }
  }

  void _retry() {
    setState(() {
      _future = _repository.getById(widget.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<NewsDetailModel>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.error is NewsNotFoundException) {
            return _NewsNotFoundState();
          }

          if (snapshot.hasError) {
            return _NewsErrorState(onRetry: _retry);
          }

          final news = snapshot.data!;

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                backgroundColor: Colors.black,
                expandedHeight: 260,
                pinned: true,
                floating: false,
                snap: false,
                leading: Padding(
                  padding: const EdgeInsets.all(8),
                  child: CircleAvatar(
                    backgroundColor: Colors.black45,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  collapseMode: CollapseMode.parallax,
                  background: NewsPhotoCarousel(photos: news.photos),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!news.isActive)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text('Notícia arquivada'),
                        ),
                      Row(
                        children: [
                          if (news.type != null)
                            Chip(
                              label: Text(
                                news.type!,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              backgroundColor: const Color(0xFFE8F5EE),
                              side: BorderSide.none,
                            ),
                          const Spacer(),
                          if (news.createdAt != null)
                            Text(
                              news.createdDate == null
                                  ? news.createdAt!
                                  : AppDateFormatter.publication(
                                      news.createdDate!,
                                    ),
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        news.title,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          Avatar(size: 36, name: news.author?.name),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  news.author?.name ?? 'Prefeitura Municipal',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      Text(
                        news.description ?? news.summary ?? '',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),

                      if (news.linkType == 'externo' &&
                          news.externalUrl != null &&
                          news.externalUrl!.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () =>
                                _openExternalUrl(news.externalUrl!),
                            icon: const Icon(Icons.open_in_new),
                            label: const Text('Ler matéria completa'),
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),

                      EngagementBar(
                        entityType: 'news',
                        entityId: news.id,
                        liked: news.liked,
                        saved: news.saved,
                        likesCount: news.likesCount,
                        service: EngagementService(ApiClient.instance.dio),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _NewsNotFoundState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Notícia não encontrada'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Voltar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _NewsErrorState extends StatelessWidget {
  final VoidCallback onRetry;

  const _NewsErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Não foi possível carregar a notícia.'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }
}
