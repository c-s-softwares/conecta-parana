import '../entities/suggestion.dart';

abstract class SuggestionRepository {
  Future<List<Suggestion>> getMySuggestions();
}

class SuggestionNetworkException implements Exception {
  const SuggestionNetworkException();
}