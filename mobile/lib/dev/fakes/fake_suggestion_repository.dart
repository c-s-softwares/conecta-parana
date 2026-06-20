import '../../features/suggestions/domain/entities/suggestion.dart';
import '../../features/suggestions/domain/repositories/suggestion_repository.dart';

class FakeSuggestionRepository implements SuggestionRepository {
  const FakeSuggestionRepository();

  @override
  Future<List<Suggestion>> getMySuggestions() async {
    await Future.delayed(const Duration(milliseconds: 600)); 
    return _fakeSuggestions;
  }
}

final _fakeSuggestions = <Suggestion>[
  Suggestion(
    id: 'S12',
    category: 'Mobilidade',
    subject: 'Ciclovia na Av. Brasil',
    status: SuggestionStatus.respondida,
    createdAt: DateTime(2026, 4, 22),
    message:
        'Sugiro a implementação de uma ciclovia segregada na Av. Brasil, '
        'entre o Parque do Ingá e o centro. A ciclovia reduziria o tráfego de '
        'veículos, incentivaria o uso de bicicletas e melhoraria a qualidade '
        'de vida dos moradores.',
    reply: SuggestionReply(
      authorName: 'Sec. de Mobilidade Urbana',
      date: DateTime(2026, 4, 26),
      message:
          'Sua sugestão foi encaminhada ao Departamento de Mobilidade Urbana. '
          'O projeto de ciclovias 2027 está em análise técnica e o trecho da '
          'Av. Brasil é um dos candidatos prioritários. Obrigado!',
    ),
  ),
  Suggestion(
    id: 'S11',
    category: 'Meio Ambiente',
    subject: 'Mais árvores na Rua XV',
    status: SuggestionStatus.lida,
    createdAt: DateTime(2026, 4, 18),
    message:
        'Seria ótimo plantar mais árvores ao longo da Rua XV para dar sombra '
        'e melhorar o microclima da região central.',
  ),
  Suggestion(
    id: 'S10',
    category: 'Transporte',
    subject: 'Ponto de ônibus coberto — CMEI',
    status: SuggestionStatus.enviada,
    createdAt: DateTime(2026, 4, 14),
    message:
        'O ponto de ônibus em frente ao CMEI não tem cobertura, e as crianças '
        'e responsáveis ficam expostos à chuva e ao sol.',
  ),
  Suggestion(
    id: 'S09',
    category: 'Lazer',
    subject: 'Academia ao ar livre no Parque',
    status: SuggestionStatus.arquivada,
    createdAt: DateTime(2026, 4, 2),
    message:
        'Proposta de instalar equipamentos de ginástica ao ar livre no parque '
        'municipal, incentivando a prática de exercícios pela população.',
  ),
];