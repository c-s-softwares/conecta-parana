import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/media/app_network_image.dart';
import 'news_photo_viewer.dart';

class NewsPhotoCarousel extends StatefulWidget {
  final List<String> photos;

  const NewsPhotoCarousel({super.key, required this.photos});

  @override
  State<NewsPhotoCarousel> createState() => _NewsPhotoCarouselState();
}

class _NewsPhotoCarouselState extends State<NewsPhotoCarousel> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.photos.isEmpty) {
      return Container(
        height: 220,
        color: const Color(0xFFE8F5EE),
        child: const Center(
          child: Icon(
            Icons.article_outlined,
            size: 56,
            color: Color(0xFF006733),
          ),
        ),
      );
    }

    return SizedBox(
      height: 260,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            clipBehavior: Clip.hardEdge,
            itemCount: widget.photos.length,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemBuilder: (context, index) {
              return GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => NewsPhotoViewer(
                        photos: widget.photos,
                        initialIndex: index,
                      ),
                    ),
                  );
                },
                child: AppNetworkImage(
                  imageUrl: widget.photos[index],
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  fallback: Container(
                    color: const Color(0xFFE8F5EE),
                    child: const Center(
                      child: Icon(Icons.broken_image_outlined),
                    ),
                  ),
                ),
              );
            },
          ),

          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.photos.length, (index) {
                final selected = index == _currentIndex;

                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: selected ? 18 : 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: selected ? Colors.white : Colors.white70,
                    borderRadius: BorderRadius.circular(999),
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
