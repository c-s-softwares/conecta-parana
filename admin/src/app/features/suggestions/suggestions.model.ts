export type SuggestionStatus = 'enviada' | 'lida' | 'respondida' | 'concluída' | 'arquivada';

export interface SuggestionUserSummary {
  id: string;
  name: string;
}

export interface SuggestionResponseDto {
  id: string;
  subject: string;
  message: string;
  status: SuggestionStatus | string;
  userId: string;
  cityId: string;
  user?: SuggestionUserSummary | null;
  response?: string | null;
  respondedAt?: string | Date | null;
  respondedById?: string | null;
  respondedBy?: SuggestionUserSummary | null;
}

export interface RespondSuggestionDto {
  response?: string;
}

export const SUGGESTIONS_ERRORS = {
  SUGGESTION_NOT_FOUND: 'suggestion_not_found',
  INVALID_STATUS_TRANSITION: 'invalid_status_transition',
  NOT_OWNER_OR_ADMIN: 'not_owner_or_admin',
} as const;
