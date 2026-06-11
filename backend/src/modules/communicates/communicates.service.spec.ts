import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { CommunicateService } from './communicates.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_COMMUNICATE_ID = `${TABLE_PREFIX.COMMUNICATE}_01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}_01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_USER_ID = `${TABLE_PREFIX.USER}_01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_COMMUNICATE = {
  id: MOCK_COMMUNICATE_ID,
  title: 'Nova ferramenta disponível',
  description: 'A nova ferramenta já está disponível para os cidadãos.',
  isActive: true,
  cityId: MOCK_CITY_ID,
  userId: MOCK_USER_ID,
};

const mockPrisma = {
  client: {
    communicate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
};

const mockAdminUser = {
  id: MOCK_USER_ID,
  cityId: MOCK_CITY_ID,
  role: Role.ADMIN,
};

describe('CommunicateService', () => {
  let service: CommunicateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicateService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommunicateService>(CommunicateService);
    jest.clearAllMocks();
  });

  it('deve criar comunicado usando cityId e userId do ADMIN autenticado', async () => {
    mockPrisma.client.communicate.create.mockResolvedValue(MOCK_COMMUNICATE);

    const result = await service.createWithUser(
      {
        title: 'Nova ferramenta disponível',
        description: 'A nova ferramenta já está disponível para os cidadãos.',
        cityId: 'cit_ignorado',
      },
      mockAdminUser,
    );

    expect(result).toEqual(MOCK_COMMUNICATE);
    expect(mockPrisma.client.communicate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Nova ferramenta disponível',
        description: 'A nova ferramenta já está disponível para os cidadãos.',
        isActive: true,
        cityId: MOCK_CITY_ID,
        userId: MOCK_USER_ID,
      }),
    });
  });

  it('deve atualizar comunicado quando ADMIN pertence à mesma cidade', async () => {
    mockPrisma.client.communicate.findUnique.mockResolvedValue(
      MOCK_COMMUNICATE,
    );
    mockPrisma.client.communicate.update.mockResolvedValue({
      ...MOCK_COMMUNICATE,
      title: 'Título atualizado',
    });

    const result = await service.updateWithUser(
      MOCK_COMMUNICATE_ID,
      { title: 'Título atualizado' },
      mockAdminUser,
    );

    expect(result.title).toBe('Título atualizado');
  });

  it('deve realizar soft-delete alterando isActive para false', async () => {
    mockPrisma.client.communicate.findUnique.mockResolvedValue(
      MOCK_COMMUNICATE,
    );
    mockPrisma.client.communicate.update.mockResolvedValue({
      ...MOCK_COMMUNICATE,
      isActive: false,
    });

    await service.removeWithUser(MOCK_COMMUNICATE_ID, mockAdminUser);

    expect(mockPrisma.client.communicate.update).toHaveBeenCalledWith({
      where: { id: MOCK_COMMUNICATE_ID },
      data: { isActive: false },
    });
  });

  it('deve lançar comunicado_not_found se comunicado não existir', async () => {
    mockPrisma.client.communicate.findUnique.mockResolvedValue(null);

    await expect(
      service.updateWithUser(
        MOCK_COMMUNICATE_ID,
        { title: 'Título atualizado' },
        mockAdminUser,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar city_scope_denied se ADMIN tentar alterar comunicado de outra cidade', async () => {
    mockPrisma.client.communicate.findUnique.mockResolvedValue({
      ...MOCK_COMMUNICATE,
      cityId: `${TABLE_PREFIX.CITY}_OUTRA`,
    });

    await expect(
      service.updateWithUser(
        MOCK_COMMUNICATE_ID,
        { title: 'Título atualizado' },
        mockAdminUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar city_scope_denied se ADMIN não possuir cityId', async () => {
    await expect(
      service.createWithUser(
        {
          title: 'Nova ferramenta disponível',
          description: 'A nova ferramenta já está disponível para os cidadãos.',
        },
        {
          id: MOCK_USER_ID,
          cityId: null,
          role: Role.ADMIN,
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
