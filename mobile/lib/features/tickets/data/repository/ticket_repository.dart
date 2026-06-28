import 'package:conectaparana/core/network/api_client.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_detail_model.dart';
import 'package:conectaparana/features/tickets/data/models/ticket_model.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';

class TicketNetworkException implements Exception {}

class TicketNotFoundException implements Exception {}

class TicketForbiddenException implements Exception {}

class TicketCommentException implements Exception {}

class TicketUserWithoutCityException implements Exception {}

class TicketStorageUnavailableException implements Exception {}

class CreateTicketRequest {
  final String type;
  final String title;
  final String description;
  final String? address;

  const CreateTicketRequest({
    required this.type,
    required this.title,
    required this.description,
    this.address,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'title': title,
      'description': description,
      if (address != null && address!.isNotEmpty) 'address': address,
    };
  }
}

class TicketPhotoUpload {
  final Uint8List bytes;
  final String fileName;
  final String mimeType;

  const TicketPhotoUpload({
    required this.bytes,
    required this.fileName,
    required this.mimeType,
  });
}

abstract class TicketRepository {
  Future<List<Ticket>> getMyTickets();
  Future<TicketDetail> getTicketDetail(String id);
  Future<TicketComment> addComment({
    required String ticketId,
    required String message,
  });
  Future<Ticket> createTicket(CreateTicketRequest request);
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  });
}

class RemoteTicketRepository implements TicketRepository {
  final ApiClient _client;

  RemoteTicketRepository({ApiClient? client})
    : _client = client ?? ApiClient.instance;

  Options get _authOptions => Options(extra: {'auth': true});

  @override
  Future<List<Ticket>> getMyTickets() async {
    try {
      final response = await _client.dio.get(
        '/tickets/me',
        options: _authOptions,
      );
      final data = response.data;
      final items =
          (data is Map<String, dynamic> ? data['items'] : data)
              as List<dynamic>;

      final tickets = items
          .map((item) => Ticket.fromJson(item as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return tickets;
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) throw TicketNotFoundException();
      throw TicketNetworkException();
    }
  }

  @override
  Future<TicketDetail> getTicketDetail(String id) async {
    try {
      final response = await _client.dio.get(
        '/tickets/$id',
        options: _authOptions,
      );
      return TicketDetail.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) throw TicketNotFoundException();
      if (error.response?.statusCode == 403) throw TicketForbiddenException();
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
        options: _authOptions,
      );
      return TicketComment.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) throw TicketNotFoundException();
      if (error.response?.statusCode == 403) throw TicketForbiddenException();
      throw TicketCommentException();
    }
  }

  @override
  Future<Ticket> createTicket(CreateTicketRequest request) async {
    try {
      final response = await _client.dio.post(
        '/tickets',
        data: request.toJson(),
        options: _authOptions,
      );
      return Ticket.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (error) {
      if (_errorCode(error) == 'ticket_user_without_city') {
        throw TicketUserWithoutCityException();
      }
      throw TicketNetworkException();
    }
  }

  @override
  Future<void> uploadTicketPhoto({
    required String ticketId,
    required TicketPhotoUpload photo,
  }) async {
    try {
      final data = FormData.fromMap({
        'entityType': 'ticket',
        'entityId': ticketId,
        'file': MultipartFile.fromBytes(
          photo.bytes,
          filename: photo.fileName,
          contentType: MediaType.parse(photo.mimeType),
        ),
      });

      await _client.dio.post(
        '/uploads/photos',
        data: data,
        options: Options(
          extra: {'auth': true},
          contentType: 'multipart/form-data',
        ),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 503 ||
          _errorCode(error) == 'storage_unavailable') {
        throw TicketStorageUnavailableException();
      }
      throw TicketNetworkException();
    }
  }

  String? _errorCode(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) return data['code'] as String?;
    return null;
  }
}
