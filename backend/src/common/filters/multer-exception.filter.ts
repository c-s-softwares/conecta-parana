import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { apiError } from '../errors/api-error';
import { UPLOADS_ERRORS } from '../../modules/uploads/uploads.errors';

/**
 * Converte 413 Payload Too Large originados do multer em 400 + `file_too_large`,
 * mantendo o formato `{ code, message }` da API.
 *
 * Importante: o `@nestjs/platform-express` intercepta o `MulterError`
 * (`LIMIT_FILE_SIZE`) e o converte em `PayloadTooLargeException` antes do
 * filter chain. Por isso este filter captura `PayloadTooLargeException` e
 * não `MulterError` -- o `MulterError` nunca chega aqui.
 *
 * Discriminação: a mensagem 'File too large' é a constante usada pelo
 * `@nestjs/platform-express` (`multer.constants.ts`) ao converter o erro
 * do multer. Outros possíveis `PayloadTooLargeException` (ex: limit do
 * body-parser para JSON) não devem virar `file_too_large` -- nesses casos
 * mantemos o 413 mas adicionamos um `code` para o cliente.
 */
@Catch(PayloadTooLargeException)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.message === 'File too large') {
      response.status(400).json(apiError(UPLOADS_ERRORS.FILE_TOO_LARGE));
      return;
    }

    response.status(413).json({
      code: 'payload_too_large',
      message: exception.message,
    });
  }
}
