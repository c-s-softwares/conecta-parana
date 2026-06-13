import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { CommunicateService } from './communicates.service';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_COMMUNICATE_ID = `${TABLE_PREFIX.COMMUNICATE}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

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

const mockSuperAdminUser = {
  id: `${TABLE_PREFIX.USER}SUPERADMIN`,
  cityId: null,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      cityId: `${TABLE_PREFIX.CITY}OUTRA`,
    });

    await expect(
      service.updateWithUser(
        MOCK_COMMUNICATE_ID,
        { title: 'Título atualizado' },
        mockAdminUser,
      ),
    ).rejects.toThrow(ForbiddenException);
  });


  it('deve criar comunicado usando cityId enviado no payload se Super Admin', async () => {
    mockPrisma.client.communicate.create.mockResolvedValue(MOCK_COMMUNICATE);

    const result = await service.createWithUser(
      {
        title: 'Nova ferramenta disponível',
        description: 'A nova ferramenta já está disponível para os cidadãos.',
        cityId: MOCK_CITY_ID,
      },
      mockSuperAdminUser,
    );

    expect(result).toEqual(MOCK_COMMUNICATE);
    expect(mockPrisma.client.communicate.create).toHaveBeenCalledWith({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({
        cityId: MOCK_CITY_ID,
        userId: mockSuperAdminUser.id,
      }),
    });
  });

  it('deve lançar city_required se Super Admin não informar cityId na criação', async () => {
    await expect(
      service.createWithUser(
        {
          title: 'Nova ferramenta disponível',
          description: 'A nova ferramenta já está disponível para os cidadãos.',
        },
        mockSuperAdminUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve permitir atualizar comunicado de qualquer cidade se Super Admin', async () => {
    mockPrisma.client.communicate.findUnique.mockResolvedValue({
      ...MOCK_COMMUNICATE,
      cityId: `${TABLE_PREFIX.CITY}OUTRA`,
    });
    mockPrisma.client.communicate.update.mockResolvedValue({
      ...MOCK_COMMUNICATE,
      title: 'Título atualizado',
    });

    const result = await service.updateWithUser(
      MOCK_COMMUNICATE_ID,
      { title: 'Título atualizado' },
      mockSuperAdminUser,
    );

    expect(result.title).toBe('Título atualizado');
  });
});
