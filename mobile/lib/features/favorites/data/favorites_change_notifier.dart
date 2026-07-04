import 'package:flutter/foundation.dart';

class FavoritesChangeNotifier extends ChangeNotifier {
  void notifyChanged() => notifyListeners();
}

final favoritesChangeNotifier = FavoritesChangeNotifier();
