import { Injectable, HttpException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(
      { code: 'too_many_attempts', message: 'Muitas tentativas. Aguarde e tente novamente.' },
      429,
    );
  }
}
