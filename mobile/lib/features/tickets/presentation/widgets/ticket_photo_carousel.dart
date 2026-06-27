import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';

class TicketPhotoCarousel extends StatefulWidget {
  final List<TicketPhoto> photos;

  const TicketPhotoCarousel({super.key, required this.photos});

  @override
  State<TicketPhotoCarousel> createState() => _TicketPhotoCarouselState();
}

class _TicketPhotoCarouselState extends State<TicketPhotoCarousel> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      key: const Key('ticket-photo-carousel'),
      height: 156,
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.photos.length,
            onPageChanged: (index) => setState(() => _currentIndex = index),
            itemBuilder: (context, index) {
              final photo = widget.photos[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: GestureDetector(
                  onTap: photo.url == null
                      ? null
                      : () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => TicketPhotoViewerPage(
                                photos: widget.photos,
                                initialIndex: index,
                              ),
                            ),
                          ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: _PhotoTile(photo: photo),
                  ),
                ),
              );
            },
          ),
          if (widget.photos.length > 1)
            Positioned(
              bottom: 10,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(widget.photos.length, (index) {
                  final active = index == _currentIndex;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: active ? Colors.white : Colors.white54,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

class _PhotoTile extends StatelessWidget {
  final TicketPhoto photo;

  const _PhotoTile({required this.photo});

  @override
  Widget build(BuildContext context) {
    final url = photo.thumbUrl ?? photo.url;
    if (url == null || url.isEmpty) {
      return Container(
        color: const Color(0xFFD0A400),
        child: const Center(
          child: Text(
            'Foto anexada',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      );
    }

    return Image.network(
      url,
      fit: BoxFit.cover,
      width: double.infinity,
      errorBuilder: (context, error, stackTrace) => Container(
        color: const Color(0xFFF5F5F5),
        child: const Icon(
          Icons.image_not_supported_outlined,
          size: 44,
          color: Colors.grey,
        ),
      ),
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(
          color: const Color(0xFFF5F5F5),
          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        );
      },
    );
  }
}

class TicketPhotoViewerPage extends StatefulWidget {
  final List<TicketPhoto> photos;
  final int initialIndex;

  const TicketPhotoViewerPage({
    super.key,
    required this.photos,
    this.initialIndex = 0,
  });

  @override
  State<TicketPhotoViewerPage> createState() => _TicketPhotoViewerPageState();
}

class _TicketPhotoViewerPageState extends State<TicketPhotoViewerPage> {
  late int _currentIndex;
  late PageController _pageController;

  List<TicketPhoto> get _viewablePhotos =>
      widget.photos.where((photo) => photo.url != null).toList();

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final photos = _viewablePhotos;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: photos.length > 1
            ? Text(
                '${_currentIndex + 1} / ${photos.length}',
                style: const TextStyle(color: Colors.white, fontSize: 16),
              )
            : null,
      ),
      body: PhotoViewGallery.builder(
        pageController: _pageController,
        itemCount: photos.length,
        onPageChanged: (index) => setState(() => _currentIndex = index),
        builder: (context, index) {
          return PhotoViewGalleryPageOptions(
            imageProvider: NetworkImage(photos[index].url!),
            minScale: PhotoViewComputedScale.contained,
            maxScale: PhotoViewComputedScale.covered * 3,
            heroAttributes: PhotoViewHeroAttributes(tag: photos[index].id),
          );
        },
        loadingBuilder: (context, event) =>
            const Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
    );
  }
}
