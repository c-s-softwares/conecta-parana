import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../../config/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_CITIZEN_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9ZZ`;
const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9CC`;
const MOCK_TICKET_ID = `${TABLE_PREFIX.TICKET}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_ADMIN_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9AA`;
const MOCK_PHOTO_ID = `${TABLE_PREFIX.PHOTO}01HZX3Y4Q9F8TAB1C2DKEYH9PH`;

const MOCK_USER = {
  id: MOCK_CITIZEN_ID,
  name: 'Cidadão Teste',
  email: 'citizen@test.com',
  password: 'hash',
  role: Role.CIDADAO,
  cityId: MOCK_CITY_ID,
};

const MOCK_TICKET = {
  id: MOCK_TICKET_ID,
  type: 'sinalização',
  title: 'Semáforo apagado',
  description: 'Av. Brasil, esquina X',
  status: 'aberto',
  address: null,
  cityId: MOCK_CITY_ID,
  userId: MOCK_CITIZEN_ID,
  assignedToId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  photos: [],
};

const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
    },
    photo: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ticketComment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  },
};

const mockNotificationService = {
  create: jest.fn(),
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
    mockPrisma.client.ticketComment.findMany.mockResolvedValue([]);
  });

  describe('create', () => {
    it('deve criar um chamado com sucesso', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.ticket.create.mockResolvedValue(MOCK_TICKET);
      mockPrisma.client.ticket.findUnique.mockResolvedValue({
        ...MOCK_TICKET,
        photos: [],
      });
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.create(
        {
          type: 'sinalização',
          title: 'Semáforo apagado',
          description: 'Av. Brasil, esquina X',
        },
        MOCK_CITIZEN_ID,
      );

      expect(result.type).toBe('sinalização');
      expect(result.status).toBe('aberto');
      expect(mockPrisma.client.ticket.create).toHaveBeenCalled();
    });

    it('deve lancar BadRequestException se o usuario nao tiver cidade associada', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        cityId: null,
      });

      await expect(
        service.create(
          {
            type: 'sinalização',
            title: 'Semáforo apagado',
            description: 'Av. Brasil, esquina X',
          },
          MOCK_CITIZEN_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se o tipo do chamado nao for valido', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);

      await expect(
        service.create(
          {
            type: 'invalido',
            title: 'Semáforo apagado',
            description: 'Av. Brasil, esquina X',
          },
          MOCK_CITIZEN_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve validar photoIds e rejeitar se a foto nao existir ou nao pertencer ao usuario', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      // Simula que achou apenas 0 das fotos enviadas
      mockPrisma.client.photo.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          {
            type: 'sinalização',
            title: 'Semáforo apagado',
            description: 'Av. Brasil, esquina X',
            photoIds: [MOCK_PHOTO_ID],
          },
          MOCK_CITIZEN_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('deve lancar NotFoundException se o chamado nao existir', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('tkt_invalido', {
          sub: MOCK_CITIZEN_ID,
          role: Role.CIDADAO,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve permitir cidadao ver o proprio chamado', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.findOne(MOCK_TICKET_ID, {
        sub: MOCK_CITIZEN_ID,
        role: Role.CIDADAO,
      });

      expect(result.id).toBe(MOCK_TICKET_ID);
    });

    it('deve negar cidadao ver chamado alheia (ForbiddenException)', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);

      await expect(
        service.findOne(MOCK_TICKET_ID, {
          sub: 'usr_outro_cidadao',
          role: Role.CIDADAO,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir admin da mesma cidade ver o chamado', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.findOne(MOCK_TICKET_ID, {
        sub: MOCK_ADMIN_ID,
        role: Role.ADMIN,
        cityId: MOCK_CITY_ID,
      });

      expect(result.id).toBe(MOCK_TICKET_ID);
    });

    it('deve negar admin de outra cidade ver o chamado (ForbiddenException)', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);

      await expect(
        service.findOne(MOCK_TICKET_ID, {
          sub: MOCK_ADMIN_ID,
          role: Role.ADMIN,
          cityId: 'cit_outra_cidade',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve retornar os detalhes do chamado incluindo os comentários associados', async () => {
      const mockComments = [
        {
          id: 'tkc_1',
          ticketId: MOCK_TICKET_ID,
          authorId: MOCK_CITIZEN_ID,
          message: 'Mensagem e comentário teste',
          createdAt: new Date(),
        },
      ];
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);
      mockPrisma.client.ticketComment.findMany.mockResolvedValue(mockComments);
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.findOne(MOCK_TICKET_ID, {
        sub: MOCK_CITIZEN_ID,
        role: Role.CIDADAO,
      });

      expect(result.id).toBe(MOCK_TICKET_ID);
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].message).toBe('Mensagem e comentário teste');
      expect(mockPrisma.client.ticketComment.findMany).toHaveBeenCalledWith({
        where: { ticketId: MOCK_TICKET_ID },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status com sucesso, preencher resolvedAt e enviar notificacao se resolvido', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValueOnce(MOCK_TICKET);
      mockPrisma.client.ticket.findUnique.mockResolvedValueOnce({
        ...MOCK_TICKET,
        status: 'resolvido',
      });
      mockPrisma.client.ticket.update.mockResolvedValue({
        ...MOCK_TICKET,
        status: 'resolvido',
      });
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.updateStatus(
        MOCK_TICKET_ID,
        { status: 'resolvido' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('resolvido');
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: MOCK_CITIZEN_ID,
          title: 'Status do seu chamado atualizado',
        }),
      );
    });

    it('deve retornar o chamado imediatamente se o status novo for igual ao atual', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.updateStatus(
        MOCK_TICKET_ID,
        { status: 'aberto' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('aberto');
      expect(mockPrisma.client.ticket.update).not.toHaveBeenCalled();
      expect(mockNotificationService.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar transicao de status invalida', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue({
        ...MOCK_TICKET,
        status: 'fechado',
      });

      await expect(
        service.updateStatus(
          MOCK_TICKET_ID,
          { status: 'resolvido' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar reabertura se o chamado foi fechado ha mais de 7 dias', async () => {
      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 8);

      mockPrisma.client.ticket.findUnique.mockResolvedValue({
        ...MOCK_TICKET,
        status: 'fechado',
        updatedAt: longAgo,
      });

      await expect(
        service.updateStatus(
          MOCK_TICKET_ID,
          { status: 'reaberto' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve permitir reabertura se o chamado foi fechado ha menos de 7 dias', async () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 3);

      mockPrisma.client.ticket.findUnique.mockResolvedValueOnce({
        ...MOCK_TICKET,
        status: 'fechado',
        updatedAt: recent,
      });
      mockPrisma.client.ticket.findUnique.mockResolvedValueOnce({
        ...MOCK_TICKET,
        status: 'reaberto',
      });
      mockPrisma.client.ticket.update.mockResolvedValue({
        ...MOCK_TICKET,
        status: 'reaberto',
      });
      mockPrisma.client.$queryRaw.mockResolvedValue([]);

      const result = await service.updateStatus(
        MOCK_TICKET_ID,
        { status: 'reaberto' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('reaberto');
    });
  });

  describe('comentarios', () => {
    it('deve adicionar comentario com sucesso', async () => {
      mockPrisma.client.ticket.findUnique.mockResolvedValue(MOCK_TICKET);
      mockPrisma.client.ticketComment.create.mockResolvedValue({
        id: 'tkc_1',
        ticketId: MOCK_TICKET_ID,
        authorId: MOCK_CITIZEN_ID,
        message: 'Teste comentário',
        createdAt: new Date(),
      });

      const result = await service.addComment(
        MOCK_TICKET_ID,
        { message: 'Teste comentário' },
        MOCK_CITIZEN_ID,
        Role.CIDADAO,
        MOCK_CITY_ID,
      );

      expect(result.message).toBe('Teste comentário');
      expect(mockPrisma.client.ticketComment.create).toHaveBeenCalled();
    });
  });
});
