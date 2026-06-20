import { BadRequestException, ValidationPipeOptions } from '@nestjs/common';
import { apiError, VALIDATION_FAILED } from '../common/errors/api-error';

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) =>
    new BadRequestException(
      apiError(
        VALIDATION_FAILED,
        errors
          .flatMap((e) => Object.values(e.constraints ?? {}))
          .filter(Boolean),
      ),
    ),
};
