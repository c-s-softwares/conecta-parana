import 'package:conectaparana/app.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:flutter/material.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  Environment.initialize(Flavor.staging);
  await AuthService.instance.init();

  runApp(const App());
}
