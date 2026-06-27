import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';

class CommunicatePhotoViewer extends StatelessWidget {
  final String photoUrl;

  const CommunicatePhotoViewer({
    super.key,
    required this.photoUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: PhotoView(
        imageProvider: NetworkImage(photoUrl),
        backgroundDecoration: const BoxDecoration(
          color: Colors.black,
        ),
      ),
    );
  }
}