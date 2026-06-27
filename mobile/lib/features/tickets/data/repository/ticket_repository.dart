import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:dio/dio.dart';

class TicketNetworkException implements Exception {}

class TicketNotFoundException implements Exception {}

class TicketForbiddenException implements Exception {}

class TicketCommentException implements Exception {}

abstract class TicketRepository {
  Future<List<Ticket>> getMyTickets();
  Future<TicketDetail> getTicketDetail(String id);
  Future<TicketComment> addComment({required String ticketId, required String message});
}

class RemoteTicketRepository implements TicketRepository {
  final ApiClient _client;

  RemoteTicketRepository({ApiClient? client})
    : _client = client ?? ApiClient.instance;

  @override
  Future<List<Ticket>> getMyTickets() async {
    try {
      final response = await _client.dio.get('/tickets/me');
      final data = response.data;
      final items =
          (data is Map<String, dynamic> ? data['items'] : data)
              as List<dynamic>;

      final tickets = items
          .map((item) => Ticket.fromJson(item as Map<String, dynamic>))
          .toList();

      tickets.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return tickets;
    } on DioException {
      throw TicketNetworkException();
    }
  }

  @override
  Future<TicketDetail> getTicketDetail(String id) async {
    try {
      final response = await _client.dio.get('/tickets/$id');
      return TicketDetail.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) throw TicketNotFoundException();
      if (e.response?.statusCode == 403) throw TicketForbiddenException();
      throw TicketNetworkException();
    }
  }

  @override
  Future<TicketComment> addComment({
    required String ticketId,
    required String message,
  }) async {
    try {
      final response = await _client.dio.post(
        '/tickets/$ticketId/comments',
        data: {'message': message},
      );
      return TicketComment.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) throw TicketNotFoundException();
      if (e.response?.statusCode == 403) throw TicketForbiddenException();
      throw TicketCommentException();
    }
  }
}
