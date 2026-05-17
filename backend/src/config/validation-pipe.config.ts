import { BadRequestException, ValidationPipeOptions } from '@nestjs/common';

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) =>
    new BadRequestException({
      code: 'validation_failed',
      message: errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .filter(Boolean),
    }),
};
