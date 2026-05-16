import 'package:conectaparana/app.dart';
import 'package:conectaparana/core/config/environment.dart';
import 'package:flutter/material.dart';

void main() {
  Environment.initialize(Flavor.staging);
  runApp(const App());
}
