import 'package:conectaparana/app.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:flutter/material.dart';
import 'package:conectaparana/core/theme/app_theme.dart';
import 'package:conectaparana/shared/widgets/styleguide_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  Environment.initialize(Flavor.dev);
  ApiClient.instance.init();

  await AuthService.instance.init();

  runApp(const App());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      themeMode: ThemeMode.light,
      home: const StyleguideScreen(),
    );
  }
}