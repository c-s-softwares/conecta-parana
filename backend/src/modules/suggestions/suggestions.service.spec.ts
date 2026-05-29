import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SuggestionsService } from './suggestions.service';
import { PrismaService } from '../../config/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

const MOCK_CITIZEN_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9ZZ`;
const MOCK_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9CC`;
const MOCK_SUGGESTION_ID = `${TABLE_PREFIX.SUGGESTION}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const MOCK_ADMIN_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9AA`;

const MOCK_USER = {
  id: MOCK_CITIZEN_ID,
  name: 'Cidadão Teste',
  email: 'citizen@test.com',
  password: 'hash',
  role: Role.CIDADAO,
  cityId: MOCK_CITY_ID,
};

const MOCK_SUGGESTION = {
  id: MOCK_SUGGESTION_ID,
  subject: 'Praça nova',
  message: 'Seria ótimo ter uma praça no Jardim Aclimação',
  status: 'enviada',
  userId: MOCK_CITIZEN_ID,
  cityId: MOCK_CITY_ID,
  response: null,
  respondedAt: null,
  respondedById: null,
};

const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
    },
    suggestion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
};

const mockNotificationService = {
  create: jest.fn(),
};

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma sugestão com sucesso', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);
      mockPrisma.client.suggestion.create.mockResolvedValue(MOCK_SUGGESTION);

      const result = await service.create(
        { subject: 'Praça nova', message: 'Seria ótimo' },
        MOCK_CITIZEN_ID,
      );

      expect(result.subject).toBe('Praça nova');
      expect(result.status).toBe('enviada');
      expect(mockPrisma.client.suggestion.create).toHaveBeenCalled();
    });

    it('deve lancar BadRequestException se o usuario nao tiver cidade associada', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        cityId: null,
      });

      await expect(
        service.create(
          { subject: 'Praça nova', message: 'Seria ótimo' },
          MOCK_CITIZEN_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se a mensagem exceder 1000 caracteres', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);

      const longMessage = 'A'.repeat(1001);

      await expect(
        service.create(
          { subject: 'Praça nova', message: longMessage },
          MOCK_CITIZEN_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se o assunto exceder 200 caracteres', async () => {
      mockPrisma.client.user.findUnique.mockResolvedValue(MOCK_USER);

      const longSubject = 'A'.repeat(201);

      await expect(
        service.create(
          { subject: longSubject, message: 'Seria ótimo' },
          MOCK_CITIZEN_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllForUser', () => {
    it('deve retornar sugestões do usuário ordenadas por id desc', async () => {
      const mockSuggestions = [
        { ...MOCK_SUGGESTION, id: 'sgt_2' },
        { ...MOCK_SUGGESTION, id: 'sgt_1' },
      ];
      mockPrisma.client.suggestion.findMany.mockResolvedValue(mockSuggestions);

      const result = await service.findAllForUser(MOCK_CITIZEN_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sgt_2');
      expect(mockPrisma.client.suggestion.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_CITIZEN_ID },
        orderBy: { id: 'desc' },
      });
    });
  });

  describe('findAllForAdmin', () => {
    it('deve retornar sugestões da cidade do admin', async () => {
      const mockSuggestions = [MOCK_SUGGESTION];
      mockPrisma.client.suggestion.findMany.mockResolvedValue(mockSuggestions);

      const result = await service.findAllForAdmin(MOCK_CITY_ID);

      expect(result).toHaveLength(1);
      expect(mockPrisma.client.suggestion.findMany).toHaveBeenCalledWith({
        where: { cityId: MOCK_CITY_ID },
        orderBy: { id: 'desc' },
      });
    });

    it('deve retornar todas as sugestões se o admin for Super Admin (cityId null)', async () => {
      const mockSuggestions = [MOCK_SUGGESTION];
      mockPrisma.client.suggestion.findMany.mockResolvedValue(mockSuggestions);

      const result = await service.findAllForAdmin(null);

      expect(result).toHaveLength(1);
      expect(mockPrisma.client.suggestion.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { id: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('deve lancar NotFoundException se a sugestão nao existir', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('sgt_invalido', {
          sub: MOCK_CITIZEN_ID,
          role: Role.CIDADAO,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve permitir cidadao ver a propria sugestão', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );

      const result = await service.findOne(MOCK_SUGGESTION_ID, {
        sub: MOCK_CITIZEN_ID,
        role: Role.CIDADAO,
      });

      expect(result.id).toBe(MOCK_SUGGESTION_ID);
    });

    it('deve negar cidadao ver sugestão alheia (ForbiddenException)', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );

      await expect(
        service.findOne(MOCK_SUGGESTION_ID, {
          sub: 'usr_outro_cidadao',
          role: Role.CIDADAO,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir admin da mesma cidade ver a sugestão e transicionar para lida automaticamente', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );
      mockPrisma.client.suggestion.update.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'lida',
      });

      const result = await service.findOne(MOCK_SUGGESTION_ID, {
        sub: MOCK_ADMIN_ID,
        role: Role.ADMIN,
        cityId: MOCK_CITY_ID,
      });

      expect(result.status).toBe('lida');
      expect(mockPrisma.client.suggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_SUGGESTION_ID },
          data: { status: 'lida' },
        }),
      );
    });

    it('deve negar admin de outra cidade ver a sugestão (ForbiddenException)', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );

      await expect(
        service.findOne(MOCK_SUGGESTION_ID, {
          sub: MOCK_ADMIN_ID,
          role: Role.ADMIN,
          cityId: 'cit_outra_cidade',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('respond', () => {
    it('deve responder com sucesso, atualizar status para respondida e disparar notificacao', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );
      mockPrisma.client.suggestion.update.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'respondida',
        response: 'Obrigado',
      });

      const result = await service.respond(
        MOCK_SUGGESTION_ID,
        { response: 'Obrigado' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('respondida');
      expect(result.response).toBe('Obrigado');
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: MOCK_CITIZEN_ID,
          title: 'Sua sugestão foi respondida!',
        }),
      );
    });

    it('deve lancar ForbiddenException se admin de outra cidade tentar responder', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );

      await expect(
        service.respond(
          MOCK_SUGGESTION_ID,
          { response: 'Obrigado' },
          MOCK_ADMIN_ID,
          'cit_outra_cidade',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lancar BadRequestException se a sugestão estiver arquivada', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'arquivada',
      });

      await expect(
        service.respond(
          MOCK_SUGGESTION_ID,
          { response: 'Obrigado' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se a sugestão já estiver respondida', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'respondida',
      });

      await expect(
        service.respond(
          MOCK_SUGGESTION_ID,
          { response: 'Obrigado' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se a sugestão já estiver concluída', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'concluída',
      });

      await expect(
        service.respond(
          MOCK_SUGGESTION_ID,
          { response: 'Obrigado' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('conclude', () => {
    it('deve concluir com sucesso se a sugestão estiver respondida e disparar notificacao', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'respondida',
      });
      mockPrisma.client.suggestion.update.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'concluída',
        response: 'Resolvido!',
      });

      const result = await service.conclude(
        MOCK_SUGGESTION_ID,
        { response: 'Resolvido!' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('concluída');
      expect(result.response).toBe('Resolvido!');
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: MOCK_CITIZEN_ID,
          title: 'Sua sugestão foi concluída!',
        }),
      );
    });

    it('deve lancar BadRequestException se tentar concluir a partir de status diferente de respondida', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );

      await expect(
        service.conclude(
          MOCK_SUGGESTION_ID,
          { response: 'Resolvido!' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar ForbiddenException se admin de outra cidade tentar concluir', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'respondida',
      });

      await expect(
        service.conclude(
          MOCK_SUGGESTION_ID,
          { response: 'Resolvido!' },
          MOCK_ADMIN_ID,
          'cit_outra_cidade',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('archive', () => {
    it('deve arquivar uma sugestão com sucesso', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );
      mockPrisma.client.suggestion.update.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'arquivada',
        response: 'Negado',
      });

      const result = await service.archive(
        MOCK_SUGGESTION_ID,
        { response: 'Negado' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('arquivada');
      expect(mockPrisma.client.suggestion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_SUGGESTION_ID },
          data: {
            status: 'arquivada',
            response: 'Negado',
            respondedById: MOCK_ADMIN_ID,
            respondedAt: expect.any(Date) as unknown as Date,
          },
        }),
      );
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: MOCK_CITIZEN_ID,
          title: 'Sua sugestão foi arquivada.',
        }),
      );
    });

    it('deve ser idempotente (retornar sem escrever no DB) se já estiver arquivada', async () => {
      const archivedSuggestion = {
        ...MOCK_SUGGESTION,
        status: 'arquivada',
        response: 'Negado',
      };
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        archivedSuggestion,
      );

      const result = await service.archive(
        MOCK_SUGGESTION_ID,
        { response: 'Nova tentativa' },
        MOCK_ADMIN_ID,
        MOCK_CITY_ID,
      );

      expect(result.status).toBe('arquivada');
      expect(result.response).toBe('Negado');
      expect(mockPrisma.client.suggestion.update).not.toHaveBeenCalled();
    });

    it('deve lancar BadRequestException se tentar arquivar uma sugestão já concluída', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue({
        ...MOCK_SUGGESTION,
        status: 'concluída',
      });

      await expect(
        service.archive(
          MOCK_SUGGESTION_ID,
          { response: 'Negado' },
          MOCK_ADMIN_ID,
          MOCK_CITY_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar ForbiddenException se admin de outra cidade tentar arquivar', async () => {
      mockPrisma.client.suggestion.findUnique.mockResolvedValue(
        MOCK_SUGGESTION,
      );

      await expect(
        service.archive(
          MOCK_SUGGESTION_ID,
          { response: 'Negado' },
          MOCK_ADMIN_ID,
          'cit_outra_cidade',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
