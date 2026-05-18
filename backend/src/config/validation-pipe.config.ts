import { BadRequestException, ValidationPipeOptions } from '@nestjs/common';
import { API_ERROR_CODE, apiError } from '../common/errors/api-error';

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) =>
    new BadRequestException(
      apiError(
        API_ERROR_CODE.VALIDATION_FAILED,
        errors
          .flatMap((e) => Object.values(e.constraints ?? {}))
          .filter(Boolean),
      ),
    ),
};
