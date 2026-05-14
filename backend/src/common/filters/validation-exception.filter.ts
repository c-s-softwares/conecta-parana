import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

interface ValidationErrorDetail {
  field: string;
  errors: string[];
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as Record<
      string,
      unknown
    >;

    if (this.isValidationError(exceptionResponse)) {
      response.status(status).json({
        statusCode: status,
        error: 'validation_failed',
        message: 'Erro de validação',
        details: exceptionResponse.message,
      });
      return;
    }

    response.status(status).json(exceptionResponse);
  }

  private isValidationError(
    response: unknown,
  ): response is { message: ValidationErrorDetail[] } {
    if (
      typeof response !== 'object' ||
      response === null ||
      !('message' in response)
    ) {
      return false;
    }

    const res = response as { message: unknown };
    return (
      Array.isArray(res.message) &&
      res.message.length > 0 &&
      typeof res.message[0] === 'object' &&
      res.message[0] !== null &&
      'field' in res.message[0] &&
      'errors' in res.message[0]
    );
  }
}
