import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';
import { apiError } from '../errors/api-error';
import { UPLOADS_ERRORS } from '../../modules/uploads/uploads.errors';

/**
 * Captura erros do multer (LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, etc.) e
 * converte para o formato padrão `{ code, message }` da API.
 *
 * Sem este filter, o NestJS converte automaticamente o `MulterError` em
 * 413 Payload Too Large com o body default (`{ statusCode, message, error }`),
 * sem o campo `code` esperado pelos clientes -- inconsistente com o restante
 * da API.
 *
 * Hoje o único limite configurado no multer é o `fileSize` em
 * `UploadsController`. Para outros codes do multer (defesa contra
 * configurações futuras), respondemos com um code genérico de upload e a
 * mensagem original para não mascarar a causa.
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json(apiError(UPLOADS_ERRORS.FILE_TOO_LARGE));
      return;
    }

    // MulterError não esperado na configuração atual. Mantemos 400 com a
    // mensagem original para que o cliente não receba 413/500 sem contexto.
    response.status(400).json({
      code: 'upload_error',
      message: exception.message,
    });
  }
}
