import '../entities/suggestion.dart';

abstract class SuggestionRepository {
  Future<List<Suggestion>> getMySuggestions();

  Future<void> createSuggestion({
    required String subject,
    required String message,
    required String category,
  });
}

class SuggestionNetworkException implements Exception {
  const SuggestionNetworkException();
}

class SuggestionUserWithoutCityException implements Exception {
  const SuggestionUserWithoutCityException();
}

class SuggestionSubjectTooLongException implements Exception {
  const SuggestionSubjectTooLongException();
}

class SuggestionMessageTooLongException implements Exception {
  const SuggestionMessageTooLongException();
}
