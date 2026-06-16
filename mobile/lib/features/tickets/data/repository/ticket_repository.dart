import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:dio/dio.dart';

class TicketNetworkException implements Exception {}

abstract class TicketRepository {
  Future<List<Ticket>> getMyTickets();
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
}
