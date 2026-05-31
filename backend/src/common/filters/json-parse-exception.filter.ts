import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { apiError } from '../errors/api-error';
import { SHARED_ERRORS } from '../errors/shared-errors';

/**
 * Captura erros de body-parser do Express (JSON malformado) e converte
 * para o formato padrão `{ code, message }` da API.
 *
 * Sem este filter, o cliente receberia o formato default do Nest
 * (`{ statusCode, message, error }`) sem o campo `code`, quebrando a
 * consistência do contrato de erro.
 *
 * Discriminação: BadRequestException pode vir de várias origens
 * (ValidationPipe, body-parser, handlers manuais). Aqui só transformamos
 * quando NÃO há `code` na resposta (ou seja, a exceção não veio do
 * `apiError`). Caso contrário, passamos a resposta original adiante.
 *
 * Detecção do caso JSON malformado: mensagem do body-parser contém
 * padrões como "JSON", "Unexpected token", "Unexpected end of". Para
 * outros BadRequest sem `code` (caso raro), preservamos a resposta
 * original para não esconder o motivo real.
 */
@Catch(BadRequestException)
export class JsonParseExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    // Já no formato `{ code, message }` (veio do apiError) - passa direto.
    if (typeof body === 'object' && body !== null && 'code' in body) {
      response.status(status).json(body);
      return;
    }

    const message = this.extractMessage(body);

    const isJsonParseError =
      message.includes('JSON') ||
      message.includes('Unexpected token') ||
      message.includes('Unexpected end of');

    if (isJsonParseError) {
      response.status(status).json(apiError(SHARED_ERRORS.MALFORMED_JSON));
      return;
    }

    // Outro BadRequest sem code - preserva original.
    response.status(status).json(body);
  }

  private extractMessage(body: unknown): string {
    if (typeof body === 'string') {
      return body;
    }
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const msg = (body as { message: unknown }).message;
      return Array.isArray(msg) ? msg.join(' ') : String(msg);
    }
    return '';
  }
}
