import 'dart:async';
import 'package:flutter/material.dart';

class DelayedDisplay extends StatefulWidget {
  const DelayedDisplay({
    super.key,
    required this.child,
    this.delay = const Duration(milliseconds: 200),
  });

  final Widget child;
  final Duration delay;

  @override
  State<DelayedDisplay> createState() => _DelayedDisplayState();
}

class _DelayedDisplayState extends State<DelayedDisplay> {
  bool _visible = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(widget.delay, () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      _visible ? widget.child : const SizedBox.shrink();
}