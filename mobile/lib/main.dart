import 'package:flutter/material.dart';
import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:conectaparana/features/splash/splash_screen.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // ← necessário para splash
  runApp(const MyApp());
}
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      themeMode: ThemeMode.light,
       initialRoute: '/splash',
      routes: {
        '/splash':   (_) => const SplashScreen(),
        '/login':    (_) => const StyleguideScreen(), 
        '/home':     (_) => const StyleguideScreen(), 
        '/onboarding': (_) => const StyleguideScreen(),
        }
    );
  }
}