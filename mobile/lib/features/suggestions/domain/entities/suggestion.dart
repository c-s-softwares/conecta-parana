enum SuggestionStatus { enviada, lida, respondida, arquivada, concluida }

class SuggestionReply {
  final String authorName; 
  final DateTime date;
  final String message;

  const SuggestionReply({
    required this.authorName,
    required this.date,
    required this.message,
  });
}

class Suggestion {
  final String id;         
  final String category;  
  final String subject;   
  final SuggestionStatus status;
  final DateTime createdAt; 
  final String message;     
  final SuggestionReply? reply;

  const Suggestion({
    required this.id,
    required this.category,
    required this.subject,
    required this.status,
    required this.createdAt,
    required this.message,
    this.reply,
  });
}
