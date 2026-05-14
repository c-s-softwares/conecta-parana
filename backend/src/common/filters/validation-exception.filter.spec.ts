import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ValidationExceptionFilter } from './validation-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockHttpArgumentsHost = {
  getResponse: mockGetResponse,
  getRequest: jest.fn(),
};
const mockArgumentsHost: ArgumentsHost = {
  switchToHttp: () => mockHttpArgumentsHost,
  getArgs: jest.fn(),
  getArgByIndex: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
  getType: jest.fn(),
} as unknown as ArgumentsHost;

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;

  beforeEach(() => {
    filter = new ValidationExceptionFilter();
    jest.clearAllMocks();
  });

  it('deve formatar erros de validação no shape unificado', () => {
    const exception = new BadRequestException([
      {
        field: 'name',
        errors: ['name must be longer than or equal to 2 characters'],
      },
      {
        field: 'email',
        errors: ['email must be an email'],
      },
    ]);

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'validation_failed',
      message: 'Erro de validação',
      details: [
        {
          field: 'name',
          errors: ['name must be longer than or equal to 2 characters'],
        },
        {
          field: 'email',
          errors: ['email must be an email'],
        },
      ],
    });
  });

  it('deve retornar exatamente o que recebeu se já estiver estruturado', () => {
    const exception = new BadRequestException([
      {
        field: 'password',
        errors: [
          'password must be longer than or equal to 8 characters',
          'password deve conter pelo menos 1 letra e 1 número',
        ],
      },
    ]);

    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        details: [
          {
            field: 'password',
            errors: [
              'password must be longer than or equal to 8 characters',
              'password deve conter pelo menos 1 letra e 1 número',
            ],
          },
        ],
      }),
    );
  });

  it('deve repassar BadRequestException não-validação sem alterar', () => {
    const exception = new BadRequestException({
      error: 'invalid_id_format',
      message: 'Cidade não encontrada',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith({
      error: 'invalid_id_format',
      message: 'Cidade não encontrada',
    });
  });
});
