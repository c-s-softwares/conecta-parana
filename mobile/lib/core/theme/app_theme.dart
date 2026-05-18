import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  static const primaryGreen = Color(0xFF006733);
  static const inputBackground = Color(0xFFFFF0EE);
  static const mustard = Color(0xFFD4820A);
  static const teal = Color(0xFF2A7A7A);

  static ThemeData get light {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryGreen,
        primary: primaryGreen,        
        brightness: Brightness.light,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: Colors.white,
    );
  }

  static ThemeData get dark {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryGreen,
        primary: primaryGreen,
        brightness: Brightness.dark,
      ),
      useMaterial3: true,
    );
  }
}