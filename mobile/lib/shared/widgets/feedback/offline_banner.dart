import 'package:conectaparana/core/network/connectivity_service.dart';
import 'package:flutter/material.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ConnectivityStatus>(
      valueListenable: ConnectivityService.instance.status,
      builder: (context, status, _) {
        final isOffline = status == ConnectivityStatus.offline;
        return AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          alignment: Alignment.topCenter,
          child: isOffline
              ? const _OfflineBannerContent()
              : const SizedBox(width: double.infinity),
        );
      },
    );
  }
}

class _OfflineBannerContent extends StatelessWidget {
  const _OfflineBannerContent();

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFFFFF3CD); 
    const fg = Color(0xFF8A6D00); 

    return Material(
      color: bg,
      child: SafeArea(
        bottom: false,
        child: Semantics(
          liveRegion: true, 
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.wifi_off_rounded, size: 18, color: fg),
                SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'Você está offline, verifique sua conexão.',
                    style: TextStyle(
                      color: fg,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}