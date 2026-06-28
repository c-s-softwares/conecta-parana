import 'package:flutter/material.dart';
import 'package:conectaparana/app.dart';
import 'package:conectaparana/core/network/api_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.instance.init();
  runApp(const App());
}
