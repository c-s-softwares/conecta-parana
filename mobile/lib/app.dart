import 'package:conectaparana/core/auth/presentation/pages/login_screen.dart';
import 'package:conectaparana/core/auth/presentation/register_screen.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';
import 'package:flutter/material.dart';
import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:conectaparana/shared/widgets/pages/splash_page.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      themeMode: ThemeMode.light,
      home: const SplashPage(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const StyleguideScreen(),
        '/onboarding': (context) => const StyleguideScreen(),
        '/register': (context) => const RegisterScreen(),
      },
    );
  }
}
