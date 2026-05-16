import { Injectable, HttpException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { API_ERROR_CODE, apiError } from '../errors/api-error';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(apiError(API_ERROR_CODE.TOO_MANY_ATTEMPTS), 429);
  }
}
