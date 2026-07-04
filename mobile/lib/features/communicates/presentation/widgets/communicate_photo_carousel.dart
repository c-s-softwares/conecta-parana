import 'package:flutter/material.dart';
import 'package:conectaparana/shared/widgets/media/app_network_image.dart';
import 'communicate_photo_viewer.dart';

class CommunicatePhotoCarousel extends StatefulWidget {
  final List<String> photos;

  const CommunicatePhotoCarousel({super.key, required this.photos});

  @override
  State<CommunicatePhotoCarousel> createState() =>
      _CommunicatePhotoCarouselState();
}

class _CommunicatePhotoCarouselState extends State<CommunicatePhotoCarousel> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.photos.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            itemCount: widget.photos.length,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final photo = widget.photos[index];

              return GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CommunicatePhotoViewer(photoUrl: photo),
                    ),
                  );
                },
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: AppNetworkImage(
                    imageUrl: photo,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    fallback: const ColoredBox(
                      color: Color(0xFF005A30),
                      child: Center(
                        child: Icon(
                          Icons.broken_image_outlined,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 10),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.photos.length, (index) {
            final isActive = index == _currentIndex;

            return Container(
              width: isActive ? 18 : 8,
              height: 8,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: isActive ? Colors.green : Colors.grey.shade400,
                borderRadius: BorderRadius.circular(20),
              ),
            );
          }),
        ),
      ],
    );
  }
}
