import 'package:conectaparana/features/suggestions/data/repositories/remote_suggestion_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mapeia nome do usuario que respondeu a sugestao', () async {
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) => handler.resolve(
          Response(
            requestOptions: options,
            data: [
              {
                'id': 'sgt_1',
                'subject': 'Praça',
                'message': 'Mensagem',
                'status': 'respondida',
                'createdAt': '2026-06-28T10:00:00.000Z',
                'response': 'Solicitação recebida.',
                'respondedAt': '2026-06-29T10:00:00.000Z',
                'respondedByName': 'Ana Souza',
              },
            ],
          ),
        ),
      ),
    );

    final items = await RemoteSuggestionRepository(dio: dio).getMySuggestions();

    expect(items.single.reply?.authorName, 'Ana Souza');
  });

  test('na ausencia do nome usa fallback institucional sem expor id', () async {
    final dio = Dio(BaseOptions(baseUrl: 'https://api.test'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) => handler.resolve(
          Response(
            requestOptions: options,
            data: [
              {
                'id': 'sgt_1',
                'subject': 'Praça',
                'message': 'Mensagem',
                'status': 'respondida',
                'createdAt': '2026-06-28T10:00:00.000Z',
                'response': 'Solicitação recebida.',
                'respondedById': 'usr_admin_1',
              },
            ],
          ),
        ),
      ),
    );

    final items = await RemoteSuggestionRepository(dio: dio).getMySuggestions();

    expect(items.single.reply?.authorName, isNull);
  });
}
