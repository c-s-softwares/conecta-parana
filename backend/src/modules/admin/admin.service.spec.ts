import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { Role } from '@prisma/client';

// ── Dados de teste ───────────────────────────────────────────────────────────

const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;

const MOCK_CITY = {
  id: MOCK_CITY_ID,
  name: 'Maringá',
};

const MOCK_CREATED_USER = {
  id: MOCK_USER_ID,
  name: 'João da Silva',
  email: 'joao@maringa.pr.gov.br',
  password: 'hashed_password',
  role: Role.ADMIN,
  cityId: MOCK_CITY_ID,
};

const VALID_DTO = {
  name: 'João da Silva',
  email: 'joao@maringa.pr.gov.br',
  cityId: MOCK_CITY_ID,
};

// ── Dublês ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  },
};

const mockMail = {
  sendAdminWelcome: jest.fn(),
};

// ── Testes ───────────────────────────────────────────────────────────────────

describe('AdminService', () => {
  let service: AdminService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  describe('createAdminUser', () => {
    it('(a) caminho feliz: cria admin e retorna emailSent: true', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.user.create.mockResolvedValue(MOCK_CREATED_USER);
      mockMail.sendAdminWelcome.mockResolvedValue({ messageId: 'mock_123' });

      const result = await service.createAdminUser(VALID_DTO);

      expect(result).toMatchObject({
        id: MOCK_USER_ID,
        name: VALID_DTO.name,
        email: VALID_DTO.email,
        cityId: MOCK_CITY_ID,
        role: Role.ADMIN,
        emailSent: true,
      });

      // Não deve vazar a senha
      expect(result).not.toHaveProperty('password');

      // Verificar que o usuário foi criado com role ADMIN e cityId correto
      expect(mockPrisma.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            role: Role.ADMIN,
            cityId: MOCK_CITY_ID,
            email: VALID_DTO.email,
          }),
        }),
      );

      // Verificar que o email foi chamado com os dados corretos
      expect(mockMail.sendAdminWelcome).toHaveBeenCalledWith(
        expect.objectContaining({
          email: VALID_DTO.email,
          name: VALID_DTO.name,
          cityName: MOCK_CITY.name,
        }),
      );
    });

    it('(b) falha no MailService: admin criado mas emailSent: false', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.city.findFirst.mockResolvedValue(MOCK_CITY);
      mockPrisma.client.user.create.mockResolvedValue(MOCK_CREATED_USER);
      mockMail.sendAdminWelcome.mockRejectedValue(
        new Error('Resend indisponível'),
      );

      const result = await service.createAdminUser(VALID_DTO);

      expect(result.emailSent).toBe(false);
      // O usuário foi criado com sucesso
      expect(result.id).toBe(MOCK_USER_ID);
      // A criação não foi desfeita
      expect(mockPrisma.client.user.create).toHaveBeenCalledTimes(1);
    });

    it('(c) email_exists: lança ConflictException quando email já em uso', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({
        id: 'usr_existing',
      });

      await expect(service.createAdminUser(VALID_DTO)).rejects.toThrow(
        ConflictException,
      );

      await expect(service.createAdminUser(VALID_DTO)).rejects.toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        response: expect.objectContaining({ code: 'email_exists' }),
      });

      // Não deve consultar cidade nem criar usuário
      expect(mockPrisma.client.city.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.client.user.create).not.toHaveBeenCalled();
    });

    it('(d) city_not_found: lança NotFoundException quando cidade não existe', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(service.createAdminUser(VALID_DTO)).rejects.toThrow(
        NotFoundException,
      );

      await expect(
        service.createAdminUser({ ...VALID_DTO, cityId: 'cit_inexistente' }),
      ).rejects.toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        response: expect.objectContaining({ code: 'city_not_found' }),
      });
    });

    it('(d) city_not_found: lança NotFoundException quando cidade está deletada (deletedAt != null)', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      // findFirst com { deletedAt: null } retorna null para cidade deletada
      mockPrisma.client.city.findFirst.mockResolvedValue(null);

      await expect(service.createAdminUser(VALID_DTO)).rejects.toThrow(
        NotFoundException,
      );

      // Confirma que a query usou o filtro deletedAt: null
      expect(mockPrisma.client.city.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('listAdmins', () => {
    const SUPER_ADMIN_USER_ID = `${TABLE_PREFIX.USER}SUPERADMIN`;
    const CITY_MGA = `${TABLE_PREFIX.CITY}MGA`;
    const CITY_PCD = `${TABLE_PREFIX.CITY}PCD`;

    it('retorna admins ordenados com cityName resolvido via JOIN', async () => {
      mockPrisma.client.user.findMany.mockResolvedValue([
        {
          id: SUPER_ADMIN_USER_ID,
          name: 'Super',
          email: 'super@conecta.local',
          cityId: null,
          city: null,
          role: Role.ADMIN,
        },
        {
          id: MOCK_USER_ID,
          name: 'João',
          email: 'joao@maringa.pr.gov.br',
          cityId: CITY_MGA,
          city: { name: 'Maringá' },
          role: Role.ADMIN,
        },
        {
          id: `${TABLE_PREFIX.USER}PCD1`,
          name: 'Ana',
          email: 'ana@paicandu.pr.gov.br',
          cityId: CITY_PCD,
          city: { name: 'Paiçandu' },
          role: Role.ADMIN,
        },
      ]);

      const result = await service.listAdmins();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: SUPER_ADMIN_USER_ID,
        cityId: null,
        cityName: null,
      });
      expect(result[1]).toMatchObject({
        cityId: CITY_MGA,
        cityName: 'Maringá',
      });

      expect(mockPrisma.client.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: Role.ADMIN },
          orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
        }),
      );
    });

    it('retorna lista vazia quando não há admins', async () => {
      mockPrisma.client.user.findMany.mockResolvedValue([]);

      const result = await service.listAdmins();

      expect(result).toEqual([]);
    });
  });
});
