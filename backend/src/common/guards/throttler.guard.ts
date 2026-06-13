import { Injectable, HttpException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { apiError } from '../errors/api-error';
import { SHARED_ERRORS } from '../errors/shared-errors';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(apiError(SHARED_ERRORS.TOO_MANY_ATTEMPTS), 429);
  }
}
