import 'package:conectaparana/core/network/api_client.dart';
import 'package:dio/dio.dart';

import '../../domain/entities/suggestion.dart';
import '../../domain/repositories/suggestion_repository.dart';

class RemoteSuggestionRepository implements SuggestionRepository {
  final Dio _dio;

  RemoteSuggestionRepository({ApiClient? client, Dio? dio})
    : _dio = dio ?? (client ?? ApiClient.instance).dio;

  @override
  Future<List<Suggestion>> getMySuggestions() async {
    try {
      final response = await _dio.get(
        '/suggestions/me',
        options: Options(extra: {'auth': true}),
      );

      final data = response.data;
      final items =
          (data is Map<String, dynamic> ? data['items'] : data)
              as List<dynamic>;

      return items
          .map((item) => _suggestionFromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException {
      throw const SuggestionNetworkException();
    }
  }

  @override
  Future<void> createSuggestion({
    required String subject,
    required String message,
    required String category,
  }) async {
    try {
      await _dio.post(
        '/suggestions',
        data: {'subject': subject, 'message': message},
        options: Options(extra: {'auth': true}),
      );
    } on DioException catch (e) {
      switch (_errorCode(e)) {
        case 'user_without_city':
          throw const SuggestionUserWithoutCityException();
        case 'subject_too_long':
          throw const SuggestionSubjectTooLongException();
        case 'message_too_long':
          throw const SuggestionMessageTooLongException();
      }

      throw const SuggestionNetworkException();
    }
  }

  Suggestion _suggestionFromJson(Map<String, dynamic> json) {
    final response = (json['response'] as String?)?.trim();
    final respondedAt = _parseDate(json['respondedAt']);

    return Suggestion(
      id: json['id'] as String? ?? '',
      category: json['category'] as String? ?? 'Sugestão',
      subject: json['subject'] as String? ?? '',
      status: _statusFromApi(json['status'] as String?),
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      message: json['message'] as String? ?? '',
      reply: response == null || response.isEmpty
          ? null
          : SuggestionReply(
              authorName:
                  (json['respondedBy'] as Map<String, dynamic>?)?['name']
                      as String?,
              date: respondedAt ?? DateTime.now(),
              message: response,
            ),
    );
  }

  SuggestionStatus _statusFromApi(String? value) {
    switch (value) {
      case 'lida':
        return SuggestionStatus.lida;
      case 'respondida':
        return SuggestionStatus.respondida;
      case 'arquivada':
        return SuggestionStatus.arquivada;
      case 'concluida':
      case 'concluída':
        return SuggestionStatus.concluida;
      case 'enviada':
      default:
        return SuggestionStatus.enviada;
    }
  }

  DateTime? _parseDate(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }

  String? _errorCode(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) return data['code'] as String?;
    return null;
  }
}
