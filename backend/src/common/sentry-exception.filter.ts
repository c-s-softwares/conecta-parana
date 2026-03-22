import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const shouldReport = this.shouldReportToSentry(exception);

    if (shouldReport) {
      Sentry.captureException(exception);
      this.logger.error('Exception captured by Sentry/GlitchTip');
    }

    super.catch(exception, host);
  }

  private shouldReportToSentry(exception: unknown): boolean {
    // Só reportar erros 5xx e crashes inesperados
    // Erros 4xx (400, 401, 403, 404) são esperados - não são bugs
    if (exception instanceof HttpException) {
      return exception.getStatus() >= 500;
    }

    // Qualquer erro não-HttpException é inesperado - sempre reportar
    return true;
  }
}
