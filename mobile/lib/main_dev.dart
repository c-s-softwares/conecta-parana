import 'package:flutter/material.dart';
import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      home: const StyleguideScreen(),
    );
  }
}