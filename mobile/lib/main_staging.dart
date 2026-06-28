import 'package:conectaparana/app.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/core/network/connectivity_service.dart';
import 'package:conectaparana/core/router/app_router.dart';
import 'package:flutter/material.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  Environment.initialize(Flavor.staging);
  ApiClient.instance.init();

  await AuthService.instance.init();
  await AppRouter.instance.init();
  await ConnectivityService.instance.init();
  
  runApp(const App());
}
